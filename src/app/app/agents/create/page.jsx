import AgentForm from '@/views/client/Agents/Form';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { agentFormData } from '@/lib/domain/agents';

export const dynamic = 'force-dynamic';

/** GET /app/agents/create */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const props = { ...(await agentFormData(clientId)), agent: null };
    return renderPage(AgentForm, 'client/Agents/Form', props, { url: '/app/agents/create' });
}
