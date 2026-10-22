import FlowBuilder from '@/views/client/Flows/Builder';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { STATUSES, TRIGGERS, findFlowTemplate } from '@/lib/services/flows';

export const dynamic = 'force-dynamic';

/** GET /app/flows/create */
export default async function Page({ searchParams }) {
    await requireClientPage();
    const params = await searchParams;

    // A ?template= key preloads that template's canvas into the new flow.
    const tpl = params?.template ? findFlowTemplate(String(params.template)) : null;

    const props = {
        flow: {
            id: null,
            name: 'Untitled flow',
            description: null,
            status: 'draft',
            trigger_type: 'manual',
            definition: tpl?.definition ?? { nodes: [], edges: [] },
        },
        isNew: true,
        triggers: TRIGGERS,
        statuses: STATUSES,
    };

    return renderPage(FlowBuilder, 'client/Flows/Builder', props, { url: '/app/flows/create' });
}
