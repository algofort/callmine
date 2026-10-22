import { notFound } from 'next/navigation';
import ExecutionShow from '@/views/client/Flows/Executions/Show';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/flows/executions/{execution} */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { execution: id } = await params;

    const execution = await prisma.flowExecution.findUnique({
        where: { id: BigInt(id) },
        include: {
            flows: { select: { id: true, name: true } },
            flow_execution_steps: { orderBy: { id: 'asc' } },
        },
    });
    if (!execution || String(execution.client_id) !== String(clientId)) notFound();

    const props = {
        execution: {
            id: Number(execution.id),
            flow: execution.flows?.name ?? '—',
            flow_id: execution.flow_id ? Number(execution.flow_id) : null,
            status: execution.status,
            trigger_source: execution.trigger_source,
            duration_ms: execution.duration_ms,
            error: execution.error,
            started_at: iso(execution.started_at),
            finished_at: iso(execution.finished_at),
            steps: execution.flow_execution_steps.map((s) => ({
                id: Number(s.id),
                label: s.label,
                type: s.type,
                status: s.status,
                message: s.output?.message ?? null,
            })),
        },
    };

    return renderPage(ExecutionShow, 'client/Flows/Executions/Show', props, {
        url: `/app/flows/executions/${id}`,
    });
}
