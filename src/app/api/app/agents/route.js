import prisma from '@/lib/prisma';
import { gateClient, gatePlanLimit, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { agentData, agentRules } from '@/lib/domain/agents';

/** POST /app/agents (middleware plan.limit:agents). */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.agents.store' });
    if (gate.response) return gate.response;

    const limited = await gatePlanLimit(gate.clientId, 'agents');
    if (limited) return limited;

    const input = await validate(await readBody(request), agentRules(), { prisma });

    await prisma.agent.create({
        data: {
            ...agentData(input),
            client_id: BigInt(gate.clientId),
            user_id: gate.user.id,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/agents', { success: 'Agent created.' });
});
