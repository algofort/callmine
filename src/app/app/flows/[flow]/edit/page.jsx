import { notFound } from 'next/navigation';
import FlowBuilder from '@/views/client/Flows/Builder';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { STATUSES, TRIGGERS } from '@/lib/services/flows';

export const dynamic = 'force-dynamic';

/** GET /app/flows/{flow}/edit */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { flow: id } = await params;

    const flow = await prisma.flow.findUnique({ where: { id: BigInt(id) } });
    if (!flow || String(flow.client_id) !== String(clientId)) notFound();

    const props = {
        flow: plain({
            id: flow.id,
            name: flow.name,
            description: flow.description,
            status: flow.status,
            trigger_type: flow.trigger_type ?? 'manual',
            definition: flow.definition ?? { nodes: [], edges: [] },
        }),
        isNew: false,
        triggers: TRIGGERS,
        statuses: STATUSES,
    };

    return renderPage(FlowBuilder, 'client/Flows/Builder', props, { url: `/app/flows/${id}/edit` });
}
