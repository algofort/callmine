import AdminContacts from '@/views/Admin/Contacts/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';
import { maskPhone } from '@/lib/domain/contacts';

export const dynamic = 'force-dynamic';

/** GET /admin/contacts (read-only). */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_clients');
    const params = await searchParams;

    const where = {};
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ name: { contains: s } }, { email: { contains: s } }];
    }

    const contacts = await paginate(prisma.contact, {
        where,
        orderBy: { id: 'desc' },
        include: { clients: { select: { id: true, name: true } } },
        perPage: 30,
        page: params?.page ?? 1,
        path: '/admin/contacts',
        query: { search: params?.search },
        transform: (c) => ({
            id: Number(c.id),
            customer: c.clients?.name ?? null,
            name: c.name,
            phone_masked: maskPhone(c.phone),
            company: c.company,
            source: c.source,
            created_at: iso(c.created_at),
        }),
    });

    const [total, withContacts] = await Promise.all([
        prisma.contact.count(),
        prisma.contact.findMany({ distinct: ['client_id'], select: { client_id: true } }),
    ]);

    const props = {
        contacts,
        stats: [
            { label: 'Total Contacts', value: total.toLocaleString('en-US'), icon: 'user', accent: 'brand' },
            { label: 'Customers With Contacts', value: withContacts.length, icon: 'building', accent: 'signal' },
        ],
        filters: params?.search ? { search: String(params.search) } : {},
        total,
    };

    return renderPage(AdminContacts, 'Admin/Contacts/Index', props, {
        url: '/admin/contacts',
        isAdminRoute: true,
    });
}
