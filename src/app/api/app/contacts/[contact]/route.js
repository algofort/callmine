import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';

/** DELETE /app/contacts/{contact} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.contacts.destroy' });
    if (gate.response) return gate.response;

    const { contact: id } = await params;
    const contact = await prisma.contact.findUnique({ where: { id: BigInt(id) } });
    assertOwned(contact, gate.clientId);

    await prisma.contact.delete({ where: { id: contact.id } });
    return back({ success: 'Contact deleted.' });
});
