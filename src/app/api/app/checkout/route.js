import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { billingRegistry, definitions } from '@/lib/services/billing';

/** POST /app/checkout */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.checkout.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        plan_id: ['required', 'integer'],
        billing_cycle: ['required', 'string', 'in:month,year'],
        gateway: ['required', 'string', `in:${Object.keys(definitions()).join(',')}`],
    });

    const plan = await prisma.plan.findFirst({ where: { id: BigInt(data.plan_id), enabled: true } });
    if (!plan) return validationError({ plan_id: ['The selected plan id is invalid.'] });

    const registry = await billingRegistry();
    const gateway = registry.get(data.gateway);
    if (!gateway || !gateway.isConfigured()) {
        return back({ error: 'That payment gateway is not configured.' });
    }

    const result = await gateway.createCheckout(gate.user, plan, data.billing_cycle);
    if (result.error) return back({ error: result.error });

 // — a hard redirect off-site to the gateway.
    if (result.url) return NextResponse.json({ redirect: result.url, external: true });

    return back({ error: 'Checkout could not be started.' });
});
