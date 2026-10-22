import AdminSubscriptions from '@/views/Admin/Subscriptions/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/subscriptions */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_subscriptions');
    const params = await searchParams;

    const where = {};
    if (params?.status) where.status = String(params.status);
    if (params?.gateway) where.gateway = String(params.gateway);

    const subscriptions = await paginate(prisma.subscription, {
        where,
        orderBy: { created_at: 'desc' },
        include: {
            users: { select: { id: true, name: true, email: true } },
            plans: { select: { id: true, name: true, slug: true } },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/admin/subscriptions',
        query: { status: params?.status, gateway: params?.gateway },
        transform: (s) => ({
            id: Number(s.id),
            user: s.users ? { id: Number(s.users.id), name: s.users.name, email: s.users.email } : null,
            plan: s.plans ? { id: Number(s.plans.id), name: s.plans.name, slug: s.plans.slug } : null,
            status: s.status,
            gateway: s.gateway,
            gateway_subscription_id: s.gateway_subscription_id,
            starts_at: iso(s.starts_at),
            ends_at: iso(s.ends_at),
            renews_at: iso(s.renews_at),
            created_at: iso(s.created_at),
        }),
    });

    // MRR: monthly price (or list price) of every active/trialing subscription.
    const active = await prisma.subscription.findMany({
        where: { status: { in: ['active', 'trialing'] } },
        include: { plans: { select: { monthly_price_cents: true, price_cents: true } } },
    });
    const mrrCents = active.reduce(
        (sum, s) => sum + Number(s.plans?.monthly_price_cents ?? s.plans?.price_cents ?? 0),
        0,
    );

    const [total, activeCount, cancelled] = await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
        prisma.subscription.count({ where: { status: { in: ['canceled', 'ended'] } } }),
    ]);

    const props = {
        subscriptions,
        filters: {
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.gateway ? { gateway: String(params.gateway) } : {}),
        },
        stats: [
            { label: 'Total subscriptions', value: String(total), icon: 'credit-card', accent: 'brand' },
            { label: 'Active', value: String(activeCount), icon: 'check', accent: 'signal' },
            { label: 'Cancelled', value: String(cancelled), icon: 'lock', accent: 'danger' },
            {
                label: 'MRR',
                value: `$${Math.round(mrrCents / 100).toLocaleString('en-US')}`,
                icon: 'trending-up',
                accent: 'warm',
                hint: 'Active recurring revenue',
            },
        ],
    };

    return renderPage(AdminSubscriptions, 'Admin/Subscriptions/Index', props, {
        url: '/admin/subscriptions',
        isAdminRoute: true,
    });
}
