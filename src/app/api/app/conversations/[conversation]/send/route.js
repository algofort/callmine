import prisma from '@/lib/prisma';
import { assertOwned, gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { sendWhatsAppText } from '@/lib/services/messaging';

/** POST /app/conversations/{conversation}/send */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.conversations.send' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'messaging');
    if (gated) return gated;

    const { conversation: id } = await params;
    const conversation = await prisma.conversation.findUnique({ where: { id: BigInt(id) } });
    assertOwned(conversation, gate.clientId);

    const data = await validate(await readBody(request), {
        body: ['required', 'string', 'max:4000'],
    });

    // The thread's own account, else any account this client has connected.
    const account = conversation.whatsapp_account_id
        ? await prisma.whatsAppAccount.findUnique({ where: { id: conversation.whatsapp_account_id } })
        : await prisma.whatsAppAccount.findFirst({ where: { client_id: conversation.client_id } });

    if (!account) return back({ error: 'Connect a WhatsApp account first.' });

    await sendWhatsAppText(account, conversation.wa_phone, data.body);

    return back({ success: 'Message sent.' });
});
