import PromptTemplatesIndex from '@/views/client/PromptTemplates/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { CATEGORIES } from '@/lib/domain/prompt-templates';

export const dynamic = 'force-dynamic';

/** GET /app/prompt-templates */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    // Visible = system templates plus this client's own.
    const visible = { OR: [{ is_system: true }, { client_id }] };
    const where = { AND: [visible] };

    if (params?.search) {
        const s = String(params.search);
        where.AND.push({ OR: [{ name: { contains: s } }, { description: { contains: s } }] });
    }
    if (params?.category) where.AND.push({ category: String(params.category) });

    const templates = await paginate(prisma.promptTemplate, {
        where,
        orderBy: [{ usage_count: 'desc' }, { name: 'asc' }],
        perPage: 12,
        page: params?.page ?? 1,
        path: '/app/prompt-templates',
        query: { search: params?.search, category: params?.category },
        transform: (tpl) => ({
            id: Number(tpl.id),
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            content: tpl.content,
            variables: tpl.variables ?? [],
            is_system: tpl.is_system,
            usage_count: tpl.usage_count,
            owned: String(tpl.client_id) === String(clientId) && !tpl.is_system,
        }),
    });

    const [visibleCount, systemCount, customCount, mostUsed, agentsCount] = await Promise.all([
        prisma.promptTemplate.count({ where: visible }),
        prisma.promptTemplate.count({ where: { AND: [visible, { is_system: true }] } }),
        prisma.promptTemplate.count({ where: { client_id, is_system: false } }),
        prisma.promptTemplate.aggregate({ where: visible, _max: { usage_count: true } }),
        prisma.agent.count({ where: { client_id, deleted_at: null } }),
    ]);

    const props = {
        templates,
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.category ? { category: String(params.category) } : {}),
        },
        categories: CATEGORIES,
        agentsCount,
        stats: [
            { label: 'Total templates', value: String(visibleCount), icon: 'file', accent: 'brand' },
            { label: 'System', value: String(systemCount), icon: 'shield', accent: 'cold' },
            { label: 'Custom', value: String(customCount), icon: 'user', accent: 'signal' },
            { label: 'Most used', value: `${Number(mostUsed._max.usage_count ?? 0)}x`, icon: 'zap', accent: 'warm' },
        ],
    };

    return renderPage(PromptTemplatesIndex, 'client/PromptTemplates/Index', props, {
        url: '/app/prompt-templates',
    });
}
