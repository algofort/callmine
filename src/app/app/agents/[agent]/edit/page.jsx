import { notFound } from 'next/navigation';
import AgentForm from '@/views/client/Agents/Form';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { agentFormData } from '@/lib/domain/agents';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/agents/{agent}/edit */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { agent: id } = await params;

    const agent = await prisma.agent.findUnique({ where: { id: BigInt(id) } });
    if (!agent || String(agent.client_id) !== String(clientId)) notFound();

    const props = {
        ...(await agentFormData(clientId)),
        agent: plain({
            id: agent.id,
            name: agent.name,
            voice_id: agent.voice_id,
            language: agent.language,
            llm_model: agent.llm_model,
            engine: agent.engine,
            temperature: agent.temperature,
            tone: agent.tone,
            personality: agent.personality,
            system_prompt: agent.system_prompt,
            greeting: agent.greeting,
            status: agent.status,
        }),
    };

    return renderPage(AgentForm, 'client/Agents/Form', props, { url: `/app/agents/${id}/edit` });
}
