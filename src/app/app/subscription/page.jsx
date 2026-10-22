import SubscriptionShow from '@/views/client/Subscription/Show';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { effectiveSubscription, subscriptionIsActive } from '@/lib/auth';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/subscription */
export default async function Page() {
    const { user } = await requireClientPage();
    const effective = await effectiveSubscription(user);

    let subscription = null;
    let canCancel = false;
    let canUpgrade = true;

    if (effective?.plans) {
        const isClientSubscription = effective.__kind === 'client';
        canCancel = !isClientSubscription && subscriptionIsActive(effective);
        // A client-assigned plan shows "contact admin" instead of an upgrade path.
        canUpgrade = !isClientSubscription;

        subscription = {
            plan: {
                id: Number(effective.plans.id),
                name: effective.plans.name,
                slug: effective.plans.slug,
            },
            status: effective.status ?? (subscriptionIsActive(effective) ? 'active' : 'inactive'),
            renews_at: effective.__kind === 'user' ? iso(effective.renews_at) : null,
            ends_at: iso(effective.ends_at),
            gateway: effective.__kind === 'user' ? effective.gateway : null,
            managed_by_admin: isClientSubscription,
        };
    }

    return renderPage(
        SubscriptionShow,
        'client/Subscription/Show',
        { subscription, canCancel, canUpgrade },
        { url: '/app/subscription' },
    );
}
