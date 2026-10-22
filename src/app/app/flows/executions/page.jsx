import ExecutionsIndex from '@/views/client/Flows/Executions/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/flows/executions */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    if (params?.status) where.status = String(params.status);
    if (params?.flow) where.flow_id = BigInt(params.flow);

    const executions = await paginate(prisma.flowExecution, {
        where,
        orderBy: { id: 'desc' },
        include: { flows: { select: { id: true, name: true } } },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/flows/executions',
        query: { status: params?.status, flow: params?.flow },
        transform: (e) => ({
            id: Number(e.id),
            flow: e.flows?.name ?? '—',
            flow_id: e.flow_id ? Number(e.flow_id) : null,
            status: e.status,
            trigger_source: e.trigger_source,
            duration_ms: e.duration_ms,
            started_at: iso(e.started_at),
        }),
    });

    const [total, completed, failed, running] = await Promise.all([
        prisma.flowExecution.count({ where: { client_id } }),
        prisma.flowExecution.count({ where: { client_id, status: 'completed' } }),
        prisma.flowExecution.count({ where: { client_id, status: 'failed' } }),
        prisma.flowExecution.count({ where: { client_id, status: 'running' } }),
    ]);

    const props = {
        executions,
        filters: {
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.flow ? { flow: String(params.flow) } : {}),
        },
        stats: [
            { label: 'Total executions', value: String(total), icon: 'list', accent: 'brand' },
            { label: 'Completed', value: String(completed), icon: 'check', accent: 'signal' },
            { label: 'Failed', value: String(failed), icon: 'shield', accent: 'danger' },
            { label: 'Running', value: String(running), icon: 'activity', accent: 'warm' },
        ],
    };

    return renderPage(ExecutionsIndex, 'client/Flows/Executions/Index', props, {
        url: '/app/flows/executions',
    });
}
