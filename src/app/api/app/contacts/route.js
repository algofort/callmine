import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { canCreate } from '@/lib/plans';
import { SOURCE, toE164 } from '@/lib/domain/contacts';

/** POST /app/contacts */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.contacts.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        name: ['nullable', 'string', 'max:255'],
        phone: ['required', 'string', 'max:32'],
        email: ['nullable', 'email', 'max:255'],
        company: ['nullable', 'string', 'max:255'],
    });

    const phone = toE164(data.phone);
    if (!phone) return back({ error: 'That phone number is not valid.' });

    const client_id = BigInt(gate.clientId);
    const existing = await prisma.contact.findFirst({ where: { client_id, phone } });

    if (existing) {
        // Merge in only the fields that were actually provided (array_filter).
        const patch = {};
        for (const field of ['name', 'email', 'company']) {
            if (data[field]) patch[field] = data[field];
        }
        if (Object.keys(patch).length) {
            await prisma.contact.update({
                where: { id: existing.id },
                data: { ...patch, updated_at: new Date() },
            });
        }
        return back({ success: 'Contact already existed — details merged.' });
    }

    if (!(await canCreate(gate.clientId, 'contacts'))) {
        return back({ error: "You've reached your plan's contact limit. Upgrade to add more." });
    }

    await prisma.contact.create({
        data: {
            client_id,
            name: data.name ?? null,
            phone,
            email: data.email ?? null,
            company: data.company ?? null,
            source: SOURCE.MANUAL,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Contact added.' });
});
