import AdminClients from '@/views/Admin/Clients/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/clients (permission:view_clients). */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_clients');
    const params = await searchParams;

    const where = {};
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ name: { contains: s } }, { email: { contains: s } }];
    }

    // Latest ledger balance per client on this page, in one pass.
    const balances = new Map();

    const clients = await paginate(prisma.client, {
        where,
        orderBy: { name: 'asc' },
        include: {
            client_subscriptions: {
                where: { status: 'active' },
                orderBy: { id: 'desc' },
                take: 1,
                include: { plans: { select: { name: true } } },
            },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/admin/clients',
        query: { search: params?.search },
        transform: (c) => {
            const sub = c.client_subscriptions?.[0];
            return {
                id: Number(c.id),
                name: c.name,
                email: c.email,
                phone: c.phone,
                address: c.address,
                status: c.status,
                base_currency: c.base_currency,
                currency_symbol: c.currency_symbol,
                currency_position: c.currency_position,
                subscription: sub?.plans ? { name: sub.plans.name } : null,
                credit_balance: balances.get(String(c.id)) ?? 0,
            };
        },
    });

    // Fill the balances the transform above left at 0: the latest ledger row per
    // client on this page (groupBy _max picks the newest id, then one lookup).
    const ids = clients.data.map((c) => BigInt(c.id));
    if (ids.length) {
        const latest = await prisma.creditLedger.groupBy({
            by: ['client_id'],
            where: { client_id: { in: ids } },
            _max: { id: true },
        });

        const rows = await prisma.creditLedger.findMany({
            where: { id: { in: latest.map((l) => l._max.id).filter(Boolean) } },
            select: { client_id: true, balance_after: true },
        });

        for (const row of rows) balances.set(String(row.client_id), Number(row.balance_after));
        for (const c of clients.data) c.credit_balance = balances.get(String(c.id)) ?? 0;
    }

    const totalCredits = await totalPlatformCredits();

    const [total, active, suspended, plans] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: 'active' } }),
        prisma.client.count({ where: { status: 'inactive' } }),
        prisma.plan.findMany({
            where: { enabled: true },
            orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
            select: {
                id: true, name: true, slug: true,
                currency_code: true, monthly_price_cents: true, yearly_price_cents: true,
            },
        }),
    ]);

    const props = {
        clients,
        stats: [
            { label: 'Total Customers', value: total, icon: 'building', accent: 'brand' },
            { label: 'Active', value: active, icon: 'check', accent: 'signal' },
            { label: 'Suspended', value: suspended, icon: 'lock', accent: 'danger' },
            { label: 'Total Credits', value: totalCredits.toLocaleString('en-US'), icon: 'coins', accent: 'warm' },
        ],
        plans: plain(plans),
        filters: params?.search ? { search: String(params.search) } : {},
    };

    return renderPage(AdminClients, 'Admin/Clients/Index', props, {
        url: '/admin/clients',
        isAdminRoute: true,
    });
}

/** Sum of every customer's current credit balance. */
async function totalPlatformCredits() {
    const latest = await prisma.creditLedger.groupBy({
        by: ['client_id'],
        _max: { id: true },
    });

    const ids = latest.map((l) => l._max.id).filter(Boolean);
    if (!ids.length) return 0;

    const agg = await prisma.creditLedger.aggregate({
        where: { id: { in: ids } },
        _sum: { balance_after: true },
    });

    return Number(agg._sum.balance_after ?? 0);
}
