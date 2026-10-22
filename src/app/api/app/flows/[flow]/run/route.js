import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, redirectTo } from '@/lib/http';
import { nodeCount, runFlow } from '@/lib/services/flows';

/** POST /app/flows/{flow}/run */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.flows.run' });
    if (gate.response) return gate.response;

    const { flow: id } = await params;
    const flow = await prisma.flow.findUnique({ where: { id: BigInt(id) } });
    assertOwned(flow, gate.clientId);

    if (nodeCount(flow) === 0) return back({ error: 'Add at least one step before running.' });

    const execution = await runFlow(flow, 'manual');

    return redirectTo(`/app/flows/executions/${Number(execution.id)}`, { success: 'Flow executed.' });
});
