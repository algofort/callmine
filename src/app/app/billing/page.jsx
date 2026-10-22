import BillingIndex from '@/views/client/Billing/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';
import { userCan } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { balance, monthlyGrantForPlan } from '@/lib/services/credits';
import { planSummary } from '@/lib/plans';
import { billingRegistry } from '@/lib/services/billing';

export const dynamic = 'force-dynamic';

/** GET /app/billing (client.permission:billing.read). */
export default async function Page({ searchParams }) {
    const { user, clientId } = await requireClientPage();
    if (!(await userCan(user, 'billing.read'))) notFound();

    const params = await searchParams;
    const registry = await billingRegistry();

    // Returning from Stripe Checkout: fulfil immediately so the plan is live even
    // if the webhook is delayed, then top up this month's plan credits.
    if (params?.session_id) {
        const stripe = registry.get('stripe');
        if (stripe) {
            await stripe.fulfillCheckoutSession(String(params.session_id)).catch(() => {});
            if (clientId) await monthlyGrantForPlan(clientId).catch(() => {});
        }
    }

    const transactions = await paginate(prisma.paymentTransaction, {
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        include: { subscriptions: { include: { plans: { select: { id: true, name: true, slug: true } } } } },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/billing',
        transform: (t) => ({
            id: Number(t.id),
            amount_cents: Number(t.amount_cents),
            currency_code: t.currency_code,
            status: t.status,
            gateway: t.gateway,
            created_at: iso(t.created_at),
            plan: t.subscriptions?.plans ? { name: t.subscriptions.plans.name } : null,
        }),
    });

    let creditHistory = [];
    let creditBalance = 0;

    if (clientId) {
        creditBalance = await balance(clientId);
        const rows = await prisma.creditLedger.findMany({
            where: { client_id: BigInt(clientId) },
            orderBy: { id: 'desc' },
            take: 20,
        });
        creditHistory = rows.map((l) => ({
            id: Number(l.id),
            delta: l.delta,
            balance_after: l.balance_after,
            reason: l.reason,
            note: l.note,
            created_at: iso(l.created_at),
        }));
    }

    const packages = await prisma.creditPackage.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
        select: {
            id: true, name: true, credits: true,
            price_cents: true, currency_code: true, is_popular: true,
        },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [invoicesCount, spendAgg] = await Promise.all([
        prisma.paymentTransaction.count({ where: { user_id: user.id } }),
        prisma.paymentTransaction.aggregate({
            where: { user_id: user.id, status: 'paid', created_at: { gte: startOfMonth } },
            _sum: { amount_cents: true },
        }),
    ]);

    const monthSpendCents = Number(spendAgg._sum.amount_cents ?? 0);

    const props = {
        transactions,
        stats: [
            { label: 'Credit balance', value: creditBalance.toLocaleString('en-US'), icon: 'coins', accent: 'brand' },
            { label: 'Invoices', value: invoicesCount, icon: 'file', accent: 'cold' },
            {
                label: 'This month spend',
                value: `$${(monthSpendCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: 'credit-card',
                accent: 'signal',
            },
        ],
        creditBalance,
        creditPackages: plain(packages),
        creditHistory,
        planUsage: clientId ? plain(await planSummary(clientId)) : null,
        gateways: registry.listForFrontend(),
    };

    return renderPage(BillingIndex, 'client/Billing/Index', props, { url: '/app/billing' });
}
