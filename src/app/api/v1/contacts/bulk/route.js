import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { readBody, validate } from '@/lib/http';
import { toE164 } from '@/lib/domain/contacts';

/** POST /api/v1/contacts/bulk */
export const POST = apiRoute('contacts:write', async (request, { clientId }) => {
    const data = await validate(await readBody(request), {
        contacts: ['required', 'array', 'max:1000'],
    });

    let inserted = 0;
    let merged = 0;
    let skipped = 0;

    for (const row of data.contacts ?? []) {
        const e164 = toE164(row?.phone ?? '');
        if (!e164) {
            skipped++;
            continue;
        }

        const existing = await prisma.contact.findFirst({ where: { client_id: clientId, phone: e164 } });
        const values = {
            name: row.name ?? null,
            email: row.email ?? null,
            source: 'api',
            updated_at: new Date(),
        };

        if (existing) {
            await prisma.contact.update({ where: { id: existing.id }, data: values });
            merged++;
        } else {
            await prisma.contact.create({
                data: { client_id: clientId, phone: e164, ...values, created_at: new Date() },
            });
            inserted++;
        }
    }

    return apiJson({ inserted, merged, skipped });
});
