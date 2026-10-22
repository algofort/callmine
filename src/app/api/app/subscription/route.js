import { handler, gateClient } from '@/lib/guards';
import { redirectTo } from '@/lib/http';
import { effectiveSubscription, subscriptionIsActive } from '@/lib/auth';
import { billingRegistry } from '@/lib/services/billing';

/** DELETE /app/subscription */
export const DELETE = handler(async () => {
    const gate = await gateClient({ routeName: 'client.subscription.destroy' });
    if (gate.response) return gate.response;

    const effective = await effectiveSubscription(gate.user);

    if (!effective || effective.__kind !== 'user') {
        return redirectTo('/app/subscription', {
            error: 'Subscription is managed by your organization.',
        });
    }
    if (!subscriptionIsActive(effective)) {
        return redirectTo('/app/subscription', { error: 'No active subscription to cancel.' });
    }

    const registry = await billingRegistry();
    const gateway = registry.get(effective.gateway ?? 'stripe');

    if (!gateway || !(await gateway.cancel(effective))) {
        return redirectTo('/app/subscription', {
            error: 'Could not cancel subscription. Please contact support.',
        });
    }

    return redirectTo('/app/subscription', { success: 'Your subscription has been cancelled.' });
});
