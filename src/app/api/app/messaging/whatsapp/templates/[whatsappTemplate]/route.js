import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';

/** DELETE /app/messaging/whatsapp/templates/{whatsappTemplate} — ::destroyTemplate() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.whatsapp.templates.destroy' });
    if (gate.response) return gate.response;

    const { whatsappTemplate: id } = await params;
    const template = await prisma.whatsAppTemplate.findUnique({ where: { id: BigInt(id) } });
    assertOwned(template, gate.clientId);

    await prisma.whatsAppTemplate.delete({ where: { id: template.id } });
    return back({ success: 'Template deleted.' });
});
