import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';

/** DELETE /app/api-keys/{apiKey} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.api-keys.destroy' });
    if (gate.response) return gate.response;

    const { apiKey: id } = await params;
    const key = await prisma.apiKey.findUnique({ where: { id: BigInt(id) } });
    assertOwned(key, gate.clientId);

    await prisma.apiKey.delete({ where: { id: key.id } });
    return back({ success: 'API key deleted.' });
});
