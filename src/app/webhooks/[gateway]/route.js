import { handler } from '@/lib/guards';
import { billingRegistry, getDefinition } from '@/lib/services/billing';

/**
 * POST /webhooks/{gateway}/stripe()/paypal()/paddle().
 * One handler covers every gateway; each driver verifies its own signature.
 */
export const POST = handler(async (request, { params }) => {
    const { gateway } = await params;

    if (!getDefinition(gateway)) return new Response('Unknown gateway', { status: 404 });

    const cloned = request.clone();
    console.info('Billing webhook received', {
        gateway,
        body_length: (await cloned.text()).length,
    });

    const registry = await billingRegistry();
    const driver = registry.get(gateway);

    if (!driver) return new Response('Gateway not configured', { status: 503 });

    return driver.handleWebhook(request);
});
