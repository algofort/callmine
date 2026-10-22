import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';

/** DELETE /api/v1/webhooks/{webhook} */
export const DELETE = apiRoute('webhooks:write', async (request, { params, clientId }) => {
    const { webhook: id } = await params;
    const hook = await prisma.webhook.findUnique({ where: { id: BigInt(id) } });

    if (!hook || String(hook.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    await prisma.webhook.delete({ where: { id: hook.id } });
    return apiJson({ ok: true });
});
