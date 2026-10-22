import AdminPayments from '@/views/Admin/Payments/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const money = (cents) =>
    `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** GET /admin/payments */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_payment_gateways');
    const params = await searchParams;

    const where = {};
    if (params?.status) where.status = String(params.status);
    if (params?.gateway) where.gateway = String(params.gateway);

    const payments = await paginate(prisma.paymentTransaction, {
        where,
        orderBy: { created_at: 'desc' },
        include: {
            users: { select: { id: true, name: true, email: true } },
            subscriptions: { include: { plans: { select: { name: true } } } },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/admin/payments',
        query: { status: params?.status, gateway: params?.gateway },
        transform: (t) => ({
            id: Number(t.id),
            user: t.users ? { id: Number(t.users.id), name: t.users.name, email: t.users.email } : null,
            gateway: t.gateway,
            amount_cents: Number(t.amount_cents),
            currency_code: t.currency_code,
            status: t.status,
            created_at: iso(t.created_at),
            plan: t.subscriptions?.plans ? { name: t.subscriptions.plans.name } : null,
        }),
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, revenueAgg, monthAgg, pendingRefunded] = await Promise.all([
        prisma.paymentTransaction.count(),
        prisma.paymentTransaction.aggregate({ where: { status: 'succeeded' }, _sum: { amount_cents: true } }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'succeeded', created_at: { gte: startOfMonth } },
            _sum: { amount_cents: true },
        }),
        prisma.paymentTransaction.count({ where: { status: { in: ['pending', 'refunded'] } } }),
    ]);

    const props = {
        payments,
        filters: {
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.gateway ? { gateway: String(params.gateway) } : {}),
        },
        stats: [
            { label: 'Total payments', value: total, icon: 'credit-card', accent: 'brand' },
            { label: 'Total revenue', value: money(Number(revenueAgg._sum.amount_cents ?? 0)), icon: 'banknote', accent: 'signal' },
            { label: 'This month', value: money(Number(monthAgg._sum.amount_cents ?? 0)), icon: 'trending-up', accent: 'cold' },
            { label: 'Pending / Refunded', value: pendingRefunded, icon: 'clock', accent: 'warm' },
        ],
    };

    return renderPage(AdminPayments, 'Admin/Payments/Index', props, {
        url: '/admin/payments',
        isAdminRoute: true,
    });
}
