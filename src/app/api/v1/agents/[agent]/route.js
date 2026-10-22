import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { shapeAgent } from '@/lib/api/shapes';

/** GET /api/v1/agents/{agent} */
export const GET = apiRoute('agents:read', async (request, { params, clientId }) => {
    const { agent: id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id: BigInt(id) } });

    if (!agent || String(agent.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    return apiJson(shapeAgent(agent));
});
