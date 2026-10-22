import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { shapeContact } from '@/lib/api/shapes';

/** GET /api/v1/contacts/{contact} */
export const GET = apiRoute('contacts:read', async (request, { params, clientId }) => {
    const { contact: id } = await params;
    const contact = await prisma.contact.findUnique({ where: { id: BigInt(id) } });

    if (!contact || String(contact.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    return apiJson(shapeContact(contact));
});

/** DELETE /api/v1/contacts/{contact} */
export const DELETE = apiRoute('contacts:write', async (request, { params, clientId }) => {
    const { contact: id } = await params;
    const contact = await prisma.contact.findUnique({ where: { id: BigInt(id) } });

    if (!contact || String(contact.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    await prisma.contact.delete({ where: { id: contact.id } });
    return apiJson({ ok: true });
});
