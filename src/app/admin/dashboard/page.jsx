import AdminDashboard from '@/views/Admin/Dashboard';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { iso } from '@/lib/serialize';
import { creditBalance } from '@/lib/auth';
import { defaultDriver } from '@/lib/services/telephony';
import { isConfigured as voiceConfigured } from '@/lib/services/elevenlabs';

export const dynamic = 'force-dynamic';

/** GET /admin/dashboard */
export default async function Page() {
    await requireAdminPermissions();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // MRR: monthly price, or a twelfth of the yearly price for annual terms.
    const subs = await prisma.subscription.findMany({
        where: { status: { in: ['active', 'trialing'] } },
        include: { plans: true },
    });

    const mrr = subs.reduce((sum, sub) => {
        const plan = sub.plans;
        if (!plan) return sum;

        let cents = Number(plan.monthly_price_cents ?? plan.price_cents ?? 0);
        if (sub.renews_at && sub.starts_at) {
            const months =
                (new Date(sub.renews_at) - new Date(sub.starts_at)) / (30.44 * 86400000);
            if (months >= 12) cents = Math.floor(Number(plan.yearly_price_cents ?? plan.price_cents ?? 0) / 12);
        }
        return sum + cents / 100;
    }, 0);

    const calls = await prisma.call.findMany({
        where: { created_at: { gte: startOfMonth } },
        select: { status: true, qualification: true, created_at: true },
    });
    const completedMonth = calls.filter((c) => c.status === 'completed').length;

    const callsByDay = [];
    for (let offset = 6; offset >= 0; offset--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - offset);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        callsByDay.push({
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            calls: await prisma.call.count({ where: { created_at: { gte: day, lt: next } } }),
        });
    }

    const [
        customers, activeCustomers, subscriptionsActive, totalCalls,
        qualifiedLeads, queuePending, paymentsAgg, recent, top,
    ] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: 'active' } }),
        prisma.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
        prisma.call.count(),
        prisma.call.count({ where: { qualification: { in: ['hot', 'warm'] } } }),
        prisma.callQueueJob.count({ where: { status: { in: ['pending', 'scheduled', 'processing'] } } }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'succeeded', created_at: { gte: startOfMonth } },
            _sum: { amount_cents: true },
        }),
        prisma.client.findMany({ orderBy: { id: 'desc' }, take: 6 }),
        prisma.client.findMany({
            include: { _count: { select: { calls: true } } },
            orderBy: { calls: { _count: 'desc' } },
            take: 5,
        }),
    ]);

    const props = {
        kpis: {
            customers,
            active_customers: activeCustomers,
            subscriptions_active: subscriptionsActive,
            mrr: Math.round(mrr * 100) / 100,
            payments_this_month_cents: Number(paymentsAgg._sum.amount_cents ?? 0),
            total_calls: totalCalls,
            calls_this_month: calls.length,
            qualified_leads: qualifiedLeads,
            success_rate: calls.length ? Math.round((completedMonth / calls.length) * 1000) / 10 : 0,
            queue_pending: queuePending,
        },
        callsByDay,
        serviceHealth: {
            twilio: await defaultDriver().isConfigured(),
            elevenlabs: await voiceConfigured(),
            openai: !!config.ai.providers.openai.api_key,
        },
        recentCustomers: await Promise.all(
            recent.map(async (c) => ({
                id: Number(c.id),
                name: c.name,
                status: c.status,
                credits: await creditBalance(c.id),
                created_at: iso(c.created_at),
            })),
        ),
        topCustomers: top
            .filter((c) => c._count.calls > 0)
            .map((c) => ({ name: c.name, calls: c._count.calls })),
    };

    return renderPage(AdminDashboard, 'Admin/Dashboard', props, {
        url: '/admin/dashboard',
        isAdminRoute: true,
    });
}
