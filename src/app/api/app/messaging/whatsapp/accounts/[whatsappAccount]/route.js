import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';

/** DELETE /app/messaging/whatsapp/accounts/{whatsappAccount} — ::destroyAccount() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.whatsapp.accounts.destroy' });
    if (gate.response) return gate.response;

    const { whatsappAccount: id } = await params;
    const account = await prisma.whatsAppAccount.findUnique({ where: { id: BigInt(id) } });
    assertOwned(account, gate.clientId);

    await prisma.whatsAppAccount.delete({ where: { id: account.id } });
    return back({ success: 'Account removed.' });
});
