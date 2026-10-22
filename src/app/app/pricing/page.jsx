import Pricing from '@/views/client/Pricing';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { priceCentsForCycle } from '@/lib/plans';
import { defaultCurrencyCode, formatConverted } from '@/lib/services/currency';
import { billingRegistry } from '@/lib/services/billing';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/** GET /app/pricing */
export default async function Page() {
    const { user } = await requireClientPage();
    const session = await getSession();

    const displayCurrency =
        user?.display_currency ??
        user?.tenant?.currency_code ??
        session?.display_currency ??
        (await defaultCurrencyCode());

    const rows = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { sort_order: 'asc' } });

    const plans = [];
    for (const plan of rows) {
        const monthlyCents = priceCentsForCycle(plan, 'month');
        const yearlyCents = priceCentsForCycle(plan, 'year');

        plans.push({
            id: Number(plan.id),
            name: plan.name,
            slug: plan.slug,
            monthly_price_display:
                monthlyCents !== null
                    ? await formatConverted(Number(monthlyCents), plan.currency_code, displayCurrency)
                    : null,
            yearly_price_display:
                yearlyCents !== null
                    ? await formatConverted(Number(yearlyCents), plan.currency_code, displayCurrency)
                    : null,
            ai_credits: plan.ai_credits,
            websites_limit: plan.websites_limit,
            export_enabled: plan.export_enabled,
            custom_domain_enabled: plan.custom_domain_enabled,
            white_label_enabled: plan.white_label_enabled,
            is_free: Number(plan.monthly_price_cents ?? 0) === 0 && Number(plan.yearly_price_cents ?? 0) === 0,
        });
    }

    const registry = await billingRegistry();

    return renderPage(
        Pricing,
        'client/Pricing',
        { plans, gateways: registry.listForFrontend(), flash: { error: null, success: null } },
        { url: '/app/pricing' },
    );
}
