import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { paginate } from '@/lib/paginate';
import { pageFrom, perPageFrom, shapeContact } from '@/lib/api/shapes';
import { readBody, validate } from '@/lib/http';
import { toE164 } from '@/lib/domain/contacts';

/** GET /api/v1/contacts */
export const GET = apiRoute('contacts:read', async (request, { clientId }) => {
    const contacts = await paginate(prisma.contact, {
        where: { client_id: clientId },
        orderBy: { id: 'desc' },
        perPage: perPageFrom(request),
        page: pageFrom(request),
        path: '/api/v1/contacts',
        transform: shapeContact,
    });

    return apiJson(contacts);
});

/** POST /api/v1/contacts (upsert on phone). */
export const POST = apiRoute('contacts:write', async (request, { clientId }) => {
    const data = await validate(await readBody(request), {
        phone: ['required', 'string', 'max:32'],
        name: ['nullable', 'string', 'max:255'],
        email: ['nullable', 'email'],
        company: ['nullable', 'string', 'max:255'],
    });

    const e164 = toE164(data.phone);
    if (!e164) return apiJson({ message: 'Invalid phone number.' }, 422);

    const values = {
        name: data.name ?? null,
        email: data.email ?? null,
        company: data.company ?? null,
        source: 'api',
        updated_at: new Date(),
    };

    const existing = await prisma.contact.findFirst({ where: { client_id: clientId, phone: e164 } });

    const contact = existing
        ? await prisma.contact.update({ where: { id: existing.id }, data: values })
        : await prisma.contact.create({
              data: { client_id: clientId, phone: e164, ...values, created_at: new Date() },
          });

    return apiJson(shapeContact(contact), existing ? 200 : 201);
});
