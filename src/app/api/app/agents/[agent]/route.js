import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, redirectTo, validate } from '@/lib/http';
import { agentData, agentRules } from '@/lib/domain/agents';

/** PUT /app/agents/{agent} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.agents.update' });
    if (gate.response) return gate.response;

    const { agent: id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id: BigInt(id) } });
    assertOwned(agent, gate.clientId);

    const input = await validate(await readBody(request), agentRules(), { prisma });

    await prisma.agent.update({
        where: { id: agent.id },
        data: { ...agentData(input), updated_at: new Date() },
    });

    return redirectTo('/app/agents', { success: 'Agent updated.' });
});

/** DELETE /app/agents/{agent} (soft delete). */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.agents.destroy' });
    if (gate.response) return gate.response;

    const { agent: id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id: BigInt(id) } });
    assertOwned(agent, gate.clientId);

    await prisma.agent.update({
        where: { id: agent.id },
        data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return back({ success: 'Agent deleted.' });
});
