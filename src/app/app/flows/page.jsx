import FlowsIndex from '@/views/client/Flows/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { diffForHumans, iso } from '@/lib/serialize';
import { nodeCount } from '@/lib/services/flows';

export const dynamic = 'force-dynamic';

/** GET /app/flows */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    // Flow uses SoftDeletes.
    const where = { client_id, deleted_at: null };
    if (params?.search) where.name = { contains: String(params.search) };
    if (params?.status) where.status = String(params.status);

    const flows = await paginate(prisma.flow, {
        where,
        orderBy: { id: 'desc' },
        include: { _count: { select: { flow_executions: true } } },
        perPage: 12,
        page: params?.page ?? 1,
        path: '/app/flows',
        query: { search: params?.search, status: params?.status },
        transform: (f) => ({
            id: Number(f.id),
            name: f.name,
            description: f.description,
            status: f.status,
            trigger_type: f.trigger_type,
            nodes: nodeCount(f),
            executions_count: f._count.flow_executions,
            last_run_at: diffForHumans(f.last_run_at),
            updated_at: iso(f.updated_at),
        }),
    });

    const base = { client_id, deleted_at: null };
    const [total, active, drafts, executions] = await Promise.all([
        prisma.flow.count({ where: base }),
        prisma.flow.count({ where: { ...base, status: 'active' } }),
        prisma.flow.count({ where: { ...base, status: 'draft' } }),
        prisma.flowExecution.count({ where: { client_id } }),
    ]);

    const props = {
        flows,
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.status ? { status: String(params.status) } : {}),
        },
        stats: [
            { label: 'Total flows', value: String(total), icon: 'share', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'activity', accent: 'signal' },
            { label: 'Drafts', value: String(drafts), icon: 'file', accent: 'warm' },
            { label: 'Executions', value: String(executions), icon: 'list', accent: 'cold' },
        ],
    };

    return renderPage(FlowsIndex, 'client/Flows/Index', props, { url: '/app/flows' });
}
