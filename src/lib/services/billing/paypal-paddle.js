import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { priceCentsForCycle } from '@/lib/plans';
import {
    badSignature,
    findSubscription,
    handlerError,
    hmacEquals,
    markCanceled,
    okResponse,
    recordTransaction,
    upsertSubscription,
} from './base';

/** Port of App\Services\Billing\PayPalGateway and PaddleGateway. */

async function postJson(url, body, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
}

/* --------------------------------------------------------------- PayPal */

export function createPayPalGateway(clientId, clientSecret, sandbox, successUrl, cancelUrl, webhookId) {
    const key = 'paypal';
    const baseUrl = () => (sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');
    const isConfigured = () => !!clientId && !!clientSecret;

    async function accessToken() {
        try {
            const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
                signal: AbortSignal.timeout(20000),
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json.access_token ?? null;
        } catch {
            return null;
        }
    }

    return {
        key,
        name: () => 'PayPal',
        isConfigured,

 /** — product → plan → subscription. */
        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'PayPal is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (priceCents === null || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const token = await accessToken();
            if (!token) return { error: 'Could not obtain PayPal access token.' };

            const auth = { Authorization: `Bearer ${token}` };
            const amount = (Number(priceCents) / 100).toFixed(2);
            const interval = billingCycle === 'year' ? 'YEAR' : 'MONTH';
            const currency = plan.currency_code ?? 'USD';

            const productRes = await postJson(`${baseUrl()}/v1/catalogs/products`, {
                name: plan.name,
                description: `${plan.name} subscription`,
                type: 'SERVICE',
                category: 'SOFTWARE',
            }, auth);
            if (!productRes.ok) {
                console.error('PayPal create product failed', { body: productRes.json, user_id: String(user.id) });
                return { error: productRes.json?.message ?? 'PayPal product creation failed.' };
            }
            const productId = productRes.json.id;
            if (!productId) return { error: 'No product ID in PayPal response.' };

            const planRes = await postJson(`${baseUrl()}/v1/billing/plans`, {
                product_id: productId,
                name: `${plan.name} (${interval})`,
                description: plan.name,
                billing_cycles: [
                    {
                        frequency: { interval_unit: interval, interval_count: 1 },
                        tenure_type: 'REGULAR',
                        sequence: 1,
                        total_cycles: 0,
                        pricing_scheme: {
                            fixed_price: { value: amount, currency_code: currency },
                        },
                    },
                ],
                payment_preferences: { auto_bill_outstanding: true },
            }, auth);
            if (!planRes.ok) {
                console.error('PayPal create plan failed', { body: planRes.json, user_id: String(user.id) });
                return { error: planRes.json?.message ?? 'PayPal plan creation failed.' };
            }
            const paypalPlanId = planRes.json.id;
            if (!paypalPlanId) return { error: 'No plan ID in PayPal response.' };

            const subRes = await postJson(`${baseUrl()}/v1/billing/subscriptions`, {
                plan_id: paypalPlanId,
                // custom_id carries the ids back on the webhook.
                custom_id: `${user.id}|${plan.id}|${billingCycle}`,
                subscriber: { email_address: user.email },
                application_context: {
                    brand_name: config.app.name,
                    return_url: successUrl,
                    cancel_url: cancelUrl,
                },
            }, auth);
            if (!subRes.ok) {
                console.error('PayPal create subscription failed', { body: subRes.json, user_id: String(user.id) });
                return { error: subRes.json?.message ?? 'PayPal subscription creation failed.' };
            }

            const approve = (subRes.json.links ?? []).find((l) => l.rel === 'approve');
            if (!approve?.href) return { error: 'No approval URL in PayPal response.' };

            return { url: approve.href, subscription_id: subRes.json.id };
        },

        /**
 * — verified server-side via
         * /v1/notifications/verify-webhook-signature (needs the webhook id).
         */
        async handleWebhook(request) {
            const payload = await request.text();

            let data;
            try {
                data = JSON.parse(payload);
            } catch {
                return new Response('Invalid payload', { status: 400 });
            }

            if (!webhookId) {
                console.error(
                    'PayPal webhook rejected — no webhook ID configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Webhook ID not configured', { status: 400 });
            }

            const token = await accessToken();
            if (!token) return new Response('Auth failed', { status: 500 });

            const verifyRes = await postJson(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
                auth_algo: request.headers.get('paypal-auth-algo'),
                cert_url: request.headers.get('paypal-cert-url'),
                transmission_id: request.headers.get('paypal-transmission-id'),
                transmission_sig: request.headers.get('paypal-transmission-sig'),
                transmission_time: request.headers.get('paypal-transmission-time'),
                webhook_id: webhookId,
                webhook_event: data,
            }, { Authorization: `Bearer ${token}` });

            if (!verifyRes.ok || verifyRes.json?.verification_status !== 'SUCCESS') {
                return badSignature(key);
            }

            const eventType = data.event_type ?? '';
            const resource = data.resource ?? {};

            try {
                if (['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CREATED'].includes(eventType)) {
                    const [userId, planId] = String(resource.custom_id ?? '').split('|');
                    await upsertSubscription(key, {
                        userId: Number(userId ?? 0),
                        planId: Number(planId ?? 0),
                        subId: String(resource.id ?? ''),
                        status: 'active',
                        renewsAt: resource.billing_info?.next_billing_time
                            ? new Date(resource.billing_info.next_billing_time)
                            : null,
                    });
                } else if (
                    ['BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.SUSPENDED'].includes(eventType)
                ) {
                    await markCanceled(key, String(resource.id ?? ''));
                } else if (eventType === 'PAYMENT.SALE.COMPLETED') {
                    const subscription = await findSubscription(key, String(resource.billing_agreement_id ?? ''));
                    await recordTransaction(key, subscription, {
                        txnId: String(resource.id ?? ''),
                        amountCents: Math.round(Number(resource.amount?.total ?? 0) * 100),
                        currency: String(resource.amount?.currency ?? 'USD'),
                        status: 'paid',
                        payload: resource,
                    });
                }
            } catch (e) {
                return handlerError(key, e, eventType);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;

            const token = await accessToken();
            if (!token) return false;

            const res = await postJson(
                `${baseUrl()}/v1/billing/subscriptions/${subscription.gateway_subscription_id}/cancel`,
                { reason: 'Customer requested cancellation.' },
                { Authorization: `Bearer ${token}` },
            );
            if (!res.ok && res.status !== 204) return false;

            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'canceled', ends_at: new Date(), updated_at: new Date() },
            });
            return true;
        },

        async sync() {
            return false;
        },
        async fulfillCheckoutSession() {
            return { ok: false, error: 'Not supported.' };
        },
    };
}

/* --------------------------------------------------------------- Paddle */

export function createPaddleGateway(apiKey, environment, successUrl, cancelUrl, webhookSecret) {
    const key = 'paddle';
    const baseUrl = () =>
        environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
    const isConfigured = () => !!apiKey;

    return {
        key,
        name: () => 'Paddle',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Paddle is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (priceCents === null || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const amount = String(Number(priceCents) / 100);
            const interval = billingCycle === 'year' ? 'year' : 'month';

            const res = await postJson(`${baseUrl()}/transactions`, {
                items: [
                    {
                        price: {
                            description: `${plan.name} (${interval}ly)`,
                            unit_price: {
                                amount,
                                currency_code: plan.currency_code ?? 'USD',
                            },
                            billing_cycle: { interval, frequency: 1 },
                        },
                        quantity: 1,
                    },
                ],
                customer: { email: user.email },
                custom_data: {
                    user_id: String(user.id),
                    plan_id: String(plan.id),
                    billing_cycle: billingCycle,
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            }, { Authorization: `Bearer ${apiKey}` });

            if (!res.ok) {
                console.error('Paddle create transaction failed', { body: res.json, user_id: String(user.id) });
                return { error: res.json?.error?.detail ?? 'Paddle request failed.' };
            }

            const checkoutUrl = res.json?.data?.checkout?.url;
            if (!checkoutUrl) return { error: 'No checkout URL in Paddle response.' };

            return { url: checkoutUrl, transaction_id: res.json?.data?.id };
        },

        async handleWebhook(request) {
            const payload = await request.text();

            let data;
            try {
                data = JSON.parse(payload);
            } catch {
                return new Response('Invalid payload', { status: 400 });
            }

            const eventType = data.event_type ?? '';
            console.info('Paddle webhook received', { type: eventType });

            if (!webhookSecret) {
                console.error(
                    'Paddle webhook rejected — no webhook secret configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Webhook secret not configured', { status: 400 });
            }

            if (!verifyPaddleSignature(payload, request.headers.get('paddle-signature'), webhookSecret)) {
                console.warn('Paddle webhook signature invalid');
                return new Response('Invalid signature', { status: 400 });
            }

            try {
                const d = data.data ?? {};
                if (['subscription.created', 'subscription.activated'].includes(eventType)) {
                    const custom = d.custom_data ?? {};
                    await upsertSubscription(key, {
                        userId: Number(custom.user_id ?? 0),
                        planId: Number(custom.plan_id ?? 0),
                        subId: String(d.id ?? ''),
                        status: 'active',
                        renewsAt: d.next_billed_at ? new Date(d.next_billed_at) : null,
                    });
                } else if (eventType === 'subscription.canceled') {
                    await markCanceled(key, String(d.id ?? ''));
                } else if (eventType === 'transaction.completed') {
                    const subscription = await findSubscription(key, String(d.subscription_id ?? ''));
                    const total = d.details?.totals?.grand_total ?? d.details?.totals?.total ?? 0;
                    await recordTransaction(key, subscription, {
                        txnId: String(d.id ?? ''),
                        amountCents: Number(total),
                        currency: String(d.currency_code ?? 'USD'),
                        status: 'paid',
                        payload: d,
                    });
                }
            } catch (e) {
                return handlerError(key, e, eventType);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;

            const res = await postJson(
                `${baseUrl()}/subscriptions/${subscription.gateway_subscription_id}/cancel`,
                { effective_from: 'immediately' },
                { Authorization: `Bearer ${apiKey}` },
            );
            if (!res.ok) return false;

            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'canceled', ends_at: new Date(), updated_at: new Date() },
            });
            return true;
        },

        async sync() {
            return false;
        },
        async fulfillCheckoutSession() {
            return { ok: false, error: 'Not supported.' };
        },
    };
}

/** Paddle signs `ts:body` with HMAC-SHA256, sent as `ts=…;h1=…`. */
function verifyPaddleSignature(payload, header, secret) {
    if (!header) return false;

    const parts = Object.fromEntries(
        String(header)
            .split(';')
            .map((p) => p.split('=', 2))
            .filter((p) => p.length === 2),
    );

    const ts = parts.ts;
    const h1 = parts.h1;
    if (!ts || !h1) return false;

    const expected = crypto.createHmac('sha256', secret).update(`${ts}:${payload}`).digest('hex');
    return hmacEquals(expected, h1);
}
