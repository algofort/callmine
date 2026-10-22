import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { shapeCall } from '@/lib/api/shapes';

/** GET /api/v1/calls/{call} */
export const GET = apiRoute('calls:read', async (request, { params, clientId }) => {
    const { call: id } = await params;
    const call = await prisma.call.findUnique({ where: { id: BigInt(id) } });

    // A call belonging to another customer is a 404, not a 403.
    if (!call || String(call.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    return apiJson(shapeCall(call, true));
});
