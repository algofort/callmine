import AgentsIndex from '@/views/client/Agents/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';
import { enginesForUi, engineCatalog } from '@/lib/services/integrations';

export const dynamic = 'force-dynamic';

/** GET /app/agents */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;

    // Agent uses SoftDeletes; Prisma has no global scope, so filter explicitly.
    const client_id = BigInt(clientId);
    const where = { client_id, deleted_at: null };
    if (params?.search) where.name = { contains: String(params.search) };
    if (params?.engine) where.engine = String(params.engine);

    const catalog = engineCatalog();

    const agents = await paginate(prisma.agent, {
        where,
        orderBy: { id: 'desc' },
        include: { voices: { select: { id: true, name: true } } },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/agents',
        query: { search: params?.search, engine: params?.engine },
        transform: (a) => ({
            id: Number(a.id),
            name: a.name,
            status: a.status,
            language: a.language,
            llm_model: a.llm_model,
            engine: a.engine,
            engine_label: catalog[a.engine]?.label ?? a.engine,
            engine_dot: catalog[a.engine]?.dot ?? '#6d3fea',
            voice: a.voices?.name ?? null,
            cost_per_minute_cents: a.cost_per_minute_cents,
            updated_at: iso(a.updated_at),
        }),
    });

    const base = { client_id, deleted_at: null };
    const [total, active, drafts, archived] = await Promise.all([
        prisma.agent.count({ where: base }),
        prisma.agent.count({ where: { ...base, status: 'active' } }),
        prisma.agent.count({ where: { ...base, status: 'draft' } }),
        prisma.agent.count({ where: { ...base, status: 'archived' } }),
    ]);

    const props = {
        agents,
        stats: [
            { label: 'Total agents', value: String(total), icon: 'bot', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'check', accent: 'signal' },
            { label: 'Drafts', value: String(drafts), icon: 'file', accent: 'warm' },
            { label: 'Archived', value: String(archived), icon: 'lock', accent: 'cold' },
        ],
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.engine ? { engine: String(params.engine) } : {}),
        },
        engines: await enginesForUi(),
    };

    return renderPage(AgentsIndex, 'client/Agents/Index', props, { url: '/app/agents' });
}
