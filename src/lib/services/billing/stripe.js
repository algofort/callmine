import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { priceCentsForCycle } from '@/lib/plans';
import { sendTemplateMail } from '@/lib/services/mail';
import { notify, okResponse, recordTransaction } from './base';

/**
 * Port of App\Services\Billing\StripeGateway, using the Stripe REST API directly
 * so the integration has no extra SDK dependency to keep in step.
 */

const API = 'https://api.stripe.com/v1';

/** Currencies Stripe charges in whole units. */
const ZERO_DECIMAL = [
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
    'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
];

export function amountToStripeUnit(amount, currencyCode) {
    const c = String(currencyCode).trim().toUpperCase();
    if (ZERO_DECIMAL.includes(c)) return Math.max(1, Math.round(amount));
    return Math.max(1, Math.round(amount * 100));
}

/** Stripe expects `a[b][c]=v` form encoding for nested params. */
function encodeForm(obj, prefix = '', out = new URLSearchParams()) {
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        const key = prefix ? `${prefix}[${k}]` : k;
        if (Array.isArray(v)) {
            v.forEach((item, i) => {
                if (item !== null && typeof item === 'object') encodeForm(item, `${key}[${i}]`, out);
                else out.append(`${key}[${i}]`, String(item));
            });
        } else if (typeof v === 'object') {
            encodeForm(v, key, out);
        } else {
            out.append(key, String(v));
        }
    }
    return out;
}

export function createStripeGateway(creds, testMode, successUrl, cancelUrl) {
    const secretKey = String(creds.secret_key ?? '');
    const webhookSecret = String(creds.webhook_secret ?? '');

    const isConfigured = () => secretKey !== '' && secretKey !== '0';

    async function call(path, body = null, method = 'POST') {
        const res = await fetch(`${API}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
            },
            ...(body ? { body: encodeForm(body) } : {}),
            signal: AbortSignal.timeout(30000),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error?.message ?? `Stripe HTTP ${res.status}`);
        return json;
    }

    return {
        key: 'stripe',
        name: () => 'Stripe',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Stripe is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (priceCents === null || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            try {
                const interval = billingCycle === 'year' ? 'year' : 'month';

                const price = await call('/prices', {
                    currency: String(plan.currency_code ?? 'usd').toLowerCase(),
                    unit_amount: Number(priceCents),
                    recurring: { interval },
                    product_data: { name: `${plan.name} (${interval}ly)` },
                });

                const sep = successUrl.includes('?') ? '&' : '?';
                const session = await call('/checkout/sessions', {
                    payment_method_types: ['card'],
                    mode: 'subscription',
                    customer_email: user.email,
                    line_items: [{ price: price.id, quantity: 1 }],
                    success_url: `${successUrl}${sep}session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: cancelUrl,
                    metadata: {
                        user_id: String(user.id),
                        plan_id: String(plan.id),
                        billing_cycle: billingCycle,
                    },
                    subscription_data: {
                        metadata: { user_id: String(user.id), plan_id: String(plan.id) },
                    },
                });

                return { url: session.url };
            } catch (e) {
                console.error('Stripe createCheckout failed', { error: e?.message, user_id: String(user.id) });
                return { error: e?.message };
            }
        },

 /** — one-off (credit packs). */
        async createCatalogPaymentSession(
            customerEmail, amount, currencyCode, productName, metadata, onSuccess, onCancel,
        ) {
            if (!isConfigured()) return { error: 'Stripe is not configured.' };

            const unitAmount = amountToStripeUnit(amount, currencyCode);
            if (unitAmount < 1) return { error: 'Invalid payment amount.' };

            const stringMeta = {};
            for (const [k, v] of Object.entries(metadata ?? {})) {
                stringMeta[String(k)] = typeof v === 'object' ? JSON.stringify(v) : String(v);
            }

            try {
                const session = await call('/checkout/sessions', {
                    mode: 'payment',
                    customer_email: customerEmail,
                    success_url: onSuccess,
                    cancel_url: onCancel,
                    line_items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency: String(currencyCode).trim().toLowerCase(),
                                unit_amount: unitAmount,
                                product_data: { name: productName },
                            },
                        },
                    ],
                    metadata: { checkout_kind: 'public_catalog', ...stringMeta },
                    payment_intent_data: {
                        metadata: { checkout_kind: 'public_catalog', ...stringMeta },
                    },
                });

                if (!session.url) return { error: 'Stripe did not return a checkout URL.' };
                return { url: session.url };
            } catch (e) {
                console.error('Stripe catalog checkout failed', { error: e?.message });
                return { error: e?.message };
            }
        },

        /**
 * — fails closed: without a signing secret
         * no event is processed.
         */
        async handleWebhook(request) {
            const payload = await request.text();
            const sig = request.headers.get('stripe-signature');

            if (!webhookSecret) {
                console.error(
                    'Stripe webhook rejected — no signing secret configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Webhook secret not configured', { status: 400 });
            }

            let event;
            try {
                event = verifyStripeSignature(payload, sig, webhookSecret);
            } catch (e) {
                console.warn('Stripe webhook signature verification failed', { error: e?.message });
                return new Response('Invalid signature', { status: 400 });
            }

            console.info('Stripe webhook received', { type: event.type, id: event.id });

            try {
                const object = event.data?.object ?? {};
                if (event.type === 'checkout.session.completed') await handleCheckoutCompleted(object);
                else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
                    await handleSubscriptionUpdated(object);
                } else if (event.type === 'invoice.paid') await handleInvoicePaid(object);
            } catch (e) {
                console.error('Stripe webhook handler failed', { type: event.type, error: e?.message });
                return new Response('Handler error', { status: 500 });
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            try {
                await call(`/subscriptions/${subscription.gateway_subscription_id}`, null, 'DELETE');
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'canceled', ends_at: new Date(), updated_at: new Date() },
                });
                return true;
            } catch (e) {
                console.warn('Stripe cancel failed', { error: e?.message });
                return false;
            }
        },

        async sync(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            try {
                const sub = await call(`/subscriptions/${subscription.gateway_subscription_id}`, null, 'GET');
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: sub.status,
                        renews_at: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
                        ends_at: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
                        updated_at: new Date(),
                    },
                });
                return true;
            } catch {
                return false;
            }
        },

        /**
 * — the billing page calls this on
         * return from Checkout so the subscription exists even if the webhook is late.
         */
        async fulfillCheckoutSession(sessionId) {
            if (!isConfigured()) return { ok: false, error: 'Stripe not configured.' };

            let session;
            try {
                session = await call(
                    `/checkout/sessions/${sessionId}?expand[]=subscription&expand[]=subscription.latest_invoice`,
                    null,
                    'GET',
                );
            } catch (e) {
                console.warn('Stripe fulfillCheckoutSession: retrieve failed', { error: e?.message });
                return { ok: false, error: e?.message };
            }

            if (session.payment_status !== 'paid' || !session.subscription) {
                return { ok: false, error: 'Session not paid or no subscription.' };
            }

            const userId = Number(session.metadata?.user_id ?? 0);
            const planId = Number(session.metadata?.plan_id ?? 0);
            if (!userId || !planId) {
                return { ok: false, error: 'Missing user_id or plan_id in session.' };
            }

            const subObject = typeof session.subscription === 'object' ? session.subscription : null;
            const subId = subObject?.id ?? session.subscription;
            const renewsAt = subObject?.current_period_end
                ? new Date(subObject.current_period_end * 1000)
                : null;

            const where = {
                user_id: BigInt(userId),
                gateway: 'stripe',
                gateway_subscription_id: String(subId),
            };
            const existing = await prisma.subscription.findFirst({ where });

            const subscription = existing
                ? await prisma.subscription.update({
                      where: { id: existing.id },
                      data: {
                          plan_id: BigInt(planId),
                          status: 'active',
                          renews_at: renewsAt,
                          ends_at: null,
                          updated_at: new Date(),
                      },
                  })
                : await prisma.subscription.create({
                      data: {
                          ...where,
                          plan_id: BigInt(planId),
                          status: 'active',
                          starts_at: new Date(),
                          renews_at: renewsAt,
                          created_at: new Date(),
                          updated_at: new Date(),
                      },
                  });

            const invoice = subObject?.latest_invoice;
            if (invoice && typeof invoice === 'object') {
                await recordTransaction('stripe', subscription, {
                    txnId: invoice.id,
                    amountCents: Number(invoice.amount_paid ?? 0),
                    currency: invoice.currency ?? 'usd',
                    status: 'paid',
                    payload: invoice,
                });
            }

            return { ok: true, subscription_id: Number(subscription.id) };
        },
    };
}

/* -------------------------------------------------------- event handlers */

async function handleCheckoutCompleted(session) {
    const userId = Number(session.metadata?.user_id ?? 0);
    const planId = Number(session.metadata?.plan_id ?? 0);
    const subId = typeof session.subscription === 'object' ? session.subscription?.id : session.subscription;
    if (!userId || !planId || !subId) return;

    const where = {
        user_id: BigInt(userId),
        gateway: 'stripe',
        gateway_subscription_id: String(subId),
    };
    const existing = await prisma.subscription.findFirst({ where });
    const values = {
        plan_id: BigInt(planId),
        status: 'active',
        starts_at: new Date(),
        ends_at: null,
        renews_at: null,
        updated_at: new Date(),
    };

    if (existing) await prisma.subscription.update({ where: { id: existing.id }, data: values });
    else await prisma.subscription.create({ data: { ...where, ...values, created_at: new Date() } });

    await notify('subscription_confirmation', userId, { plan_id: planId });
}

async function handleSubscriptionUpdated(sub) {
    const subscription = await prisma.subscription.findFirst({
        where: { gateway: 'stripe', gateway_subscription_id: String(sub.id) },
        include: { users: true },
    });
    if (!subscription) return;

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: sub.status,
            ends_at: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
            renews_at: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            updated_at: new Date(),
        },
    });

    if (['past_due', 'unpaid'].includes(sub.status) && subscription.users) {
        await sendTemplateMail('payment_failed', subscription.users.email, {
            app_name: config.app.name,
        }).catch((e) => console.warn('Stripe: failed to send payment failed email', e?.message));
    }
}

async function handleInvoicePaid(invoice) {
    const subscription = await prisma.subscription.findFirst({
        where: { gateway: 'stripe', gateway_subscription_id: String(invoice.subscription ?? '') },
    });

    await recordTransaction('stripe', subscription, {
        txnId: invoice.id,
        amountCents: Number(invoice.amount_paid ?? 0),
        currency: invoice.currency ?? '',
        status: 'paid',
        payload: invoice,
    });
}

/**
 * — verifies the `t=…,v1=…` header against
 * HMAC-SHA256 of `${timestamp}.${payload}` and rejects stale timestamps.
 */
export function verifyStripeSignature(payload, header, secret, toleranceSeconds = 300) {
    if (!header) throw new Error('No signature header');

    const parts = Object.fromEntries(
        String(header)
            .split(',')
            .map((p) => p.split('=', 2))
            .filter((p) => p.length === 2),
    );

    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) throw new Error('Malformed signature header');

    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) {
        throw new Error('Timestamp outside tolerance');
    }

    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error('Signature mismatch');
    }

    return JSON.parse(payload);
}
