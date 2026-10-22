import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';

/** POST /app/api-keys/{apiKey}/revoke */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.api-keys.revoke' });
    if (gate.response) return gate.response;

    const { apiKey: id } = await params;
    const key = await prisma.apiKey.findUnique({ where: { id: BigInt(id) } });
    assertOwned(key, gate.clientId);

    await prisma.apiKey.update({
        where: { id: key.id },
        data: { revoked_at: new Date(), updated_at: new Date() },
    });

    return back({ success: 'API key revoked.' });
});
