import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { paginate } from '@/lib/paginate';
import { pageFrom, perPageFrom, shapeAgent } from '@/lib/api/shapes';

/** GET /api/v1/agents */
export const GET = apiRoute('agents:read', async (request, { clientId }) => {
    const agents = await paginate(prisma.agent, {
        where: { client_id: clientId, deleted_at: null },
        orderBy: { id: 'desc' },
        perPage: perPageFrom(request),
        page: pageFrom(request),
        path: '/api/v1/agents',
        transform: shapeAgent,
    });

    return apiJson(agents);
});
