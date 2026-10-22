import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';

/** POST /api/v1/calls/{call}/hangup */
export const POST = apiRoute('calls:write', async (request, { params, clientId }) => {
    const { call: id } = await params;
    const call = await prisma.call.findUnique({ where: { id: BigInt(id) } });

    if (!call || String(call.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    await prisma.call.update({
        where: { id: call.id },
        data: { status: 'completed', ended_at: new Date(), updated_at: new Date() },
    });

    return apiJson({ ok: true });
});
