import FlowTemplates from '@/views/client/Flows/Templates';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { flowTemplates } from '@/lib/services/flows';

export const dynamic = 'force-dynamic';

/** GET /app/flows/templates */
export default async function Page() {
    await requireClientPage();
    return renderPage(
        FlowTemplates,
        'client/Flows/Templates',
        { templates: flowTemplates() },
        { url: '/app/flows/templates' },
    );
}
