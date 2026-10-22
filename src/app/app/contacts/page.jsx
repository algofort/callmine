import ContactsIndex from '@/views/client/Contacts/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { limitFor } from '@/lib/plans';
import { maskPhone } from '@/lib/domain/contacts';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/contacts */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    if (params?.search) {
        const s = String(params.search);
        where.OR = [
            { name: { contains: s } },
            { phone: { contains: s } },
            { email: { contains: s } },
        ];
    }

    const contacts = await paginate(prisma.contact, {
        where,
        orderBy: { id: 'desc' },
        include: { _count: { select: { campaign_contact: true } } },
        perPage: 25,
        page: params?.page ?? 1,
        path: '/app/contacts',
        query: { search: params?.search },
        transform: (c) => ({
            id: Number(c.id),
            name: c.name,
            phone_masked: maskPhone(c.phone),
            email: c.email,
            company: c.company,
            campaigns_count: c._count.campaign_contact,
            source: c.source,
            created_at: iso(c.created_at),
        }),
    });

    const props = {
        contacts,
        filters: params?.search ? { search: String(params.search) } : {},
        stats: {
            total: await prisma.contact.count({ where: { client_id } }),
            limit: (await limitFor(clientId, 'contacts')) ?? 0,
        },
    };

    return renderPage(ContactsIndex, 'client/Contacts/Index', props, { url: '/app/contacts' });
}
