import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { priceCentsForCycle } from '@/lib/plans';
import {
    badSignature,
    cred,
    findSubscription,
    handlerError,
    hmacEquals,
    hmacSha256,
    hmacSha512,
    markCanceled,
    nextRenewal,
    okResponse,
    recordTransaction,
    upsertSubscription,
} from './base';

/**
 * Port of the seven App\Services\Billing gateways that extend AbstractHttpGateway:
 * Razorpay, Paystack, Cashfree, Xendit, MyFatoorah, Tap, Paymob.
 *
 * Each factory returns the BillingGatewayInterface shape used by the registry.
 */

/** Str::lower(Str::random(n)) */
function randomLower(n) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(n);
    let out = '';
    for (let i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

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

function basicAuth(user, pass = '') {
    return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

function invalidPayload() {
    return new Response('Invalid payload', { status: 400 });
}

/* ------------------------------------------------------------- Razorpay */

export function createRazorpayGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const BASE = 'https://api.razorpay.com/v1';
    const key = 'razorpay';
    const auth = () => ({ Authorization: basicAuth(cred(creds, 'key_id'), cred(creds, 'key_secret')) });
    const isConfigured = () => cred(creds, 'key_id') !== '' && cred(creds, 'key_secret') !== '';

    return {
        key,
        name: () => 'Razorpay',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Razorpay is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const period = billingCycle === 'year' ? 'yearly' : 'monthly';
            const currency = String(plan.currency_code ?? 'INR').toUpperCase();

            const planRes = await postJson(`${BASE}/plans`, {
                period,
                interval: 1,
                item: { name: `${plan.name} (${period})`, amount: Number(priceCents), currency },
            }, auth());
            if (!planRes.ok) {
                console.error('Razorpay create plan failed', { body: planRes.json });
                return { error: planRes.json?.error?.description ?? 'Razorpay plan creation failed.' };
            }

            const subRes = await postJson(`${BASE}/subscriptions`, {
                plan_id: planRes.json.id,
                total_count: billingCycle === 'year' ? 10 : 120,
                customer_notify: 1,
                notes: {
                    user_id: String(user.id),
                    plan_id: String(plan.id),
                    billing_cycle: billingCycle,
                },
            }, auth());
            if (!subRes.ok) {
                console.error('Razorpay create subscription failed', { body: subRes.json });
                return { error: subRes.json?.error?.description ?? 'Razorpay subscription creation failed.' };
            }

            if (!subRes.json.short_url) return { error: 'No checkout URL in Razorpay response.' };
            return { url: subRes.json.short_url, subscription_id: subRes.json.id };
        },

        async handleWebhook(request) {
            const payload = await request.text();
            const secret = cred(creds, 'webhook_secret');
            if (secret === '') {
                console.error(
                    'Razorpay webhook rejected — no webhook secret configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Webhook secret not configured', { status: 400 });
            }

            if (!hmacEquals(hmacSha256(payload, secret), request.headers.get('x-razorpay-signature'))) {
                return badSignature(key);
            }

            let data;
            try {
                data = JSON.parse(payload);
            } catch {
                return invalidPayload();
            }

            const event = data.event ?? '';
            try {
                if (['subscription.activated', 'subscription.charged', 'subscription.resumed'].includes(event)) {
                    await onRazorpayCharged(data);
                } else if (['subscription.cancelled', 'subscription.completed', 'subscription.halted'].includes(event)) {
                    await markCanceled(key, data.payload?.subscription?.entity?.id ?? '');
                }
            } catch (e) {
                return handlerError(key, e, event);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            const res = await postJson(
                `${BASE}/subscriptions/${subscription.gateway_subscription_id}/cancel`,
                { cancel_at_cycle_end: 0 },
                auth(),
            );
            if (!res.ok) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

async function onRazorpayCharged(data) {
    const sub = data.payload?.subscription?.entity ?? {};
    const notes = sub.notes ?? {};
    const userId = Number(notes.user_id ?? 0);
    const planId = Number(notes.plan_id ?? 0);
    const subId = String(sub.id ?? '');
    const renewsAt = sub.current_end ? new Date(sub.current_end * 1000) : null;

    const model =
        userId && planId
            ? await upsertSubscription('razorpay', { userId, planId, subId, status: 'active', renewsAt })
            : await findSubscription('razorpay', subId);

    if (model && renewsAt) {
        await prisma.subscription.update({
            where: { id: model.id },
            data: { status: 'active', renews_at: renewsAt, updated_at: new Date() },
        });
    }

    const payment = data.payload?.payment?.entity;
    if (payment && typeof payment === 'object') {
        await recordTransaction('razorpay', model, {
            txnId: String(payment.id ?? ''),
            amountCents: Number(payment.amount ?? 0),
            currency: String(payment.currency ?? 'INR'),
            status: 'paid',
            payload: payment,
        });
    }
}

/* ------------------------------------------------------------- Paystack */

export function createPaystackGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const BASE = 'https://api.paystack.co';
    const key = 'paystack';
    const auth = () => ({ Authorization: `Bearer ${cred(creds, 'secret_key')}` });
    const isConfigured = () => cred(creds, 'secret_key') !== '';

    return {
        key,
        name: () => 'Paystack',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Paystack is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const interval = billingCycle === 'year' ? 'annually' : 'monthly';
            const currency = String(plan.currency_code ?? 'NGN').toUpperCase();

            const planRes = await postJson(`${BASE}/plan`, {
                name: `${plan.name} (${interval}) #${plan.id}`,
                interval,
                amount: Number(priceCents),
                currency,
            }, auth());
            if (!planRes.ok) {
                console.error('Paystack create plan failed', { body: planRes.json });
                return { error: planRes.json?.message ?? 'Paystack plan creation failed.' };
            }

            const initRes = await postJson(`${BASE}/transaction/initialize`, {
                email: user.email,
                amount: Number(priceCents),
                currency,
                plan: planRes.json?.data?.plan_code,
                callback_url: successUrl,
                metadata: {
                    user_id: String(user.id),
                    plan_id: String(plan.id),
                    billing_cycle: billingCycle,
                },
            }, auth());
            if (!initRes.ok) {
                console.error('Paystack init transaction failed', { body: initRes.json });
                return { error: initRes.json?.message ?? 'Paystack transaction failed.' };
            }

            const url = initRes.json?.data?.authorization_url;
            if (!url) return { error: 'No checkout URL in Paystack response.' };
            return { url, reference: initRes.json?.data?.reference };
        },

        async handleWebhook(request) {
            const payload = await request.text();
            const secret = cred(creds, 'secret_key');
            if (secret === '') return badSignature(key);

            if (!hmacEquals(hmacSha512(payload, secret), request.headers.get('x-paystack-signature'))) {
                return badSignature(key);
            }

            let data;
            try {
                data = JSON.parse(payload);
            } catch {
                return invalidPayload();
            }

            const event = data.event ?? '';
            try {
                if (['charge.success', 'subscription.create'].includes(event)) {
                    await onPaystackCharge(data.data ?? {});
                } else if (['subscription.disable', 'subscription.not_renew'].includes(event)) {
                    await markCanceled(key, String(data.data?.subscription_code ?? ''));
                }
            } catch (e) {
                return handlerError(key, e, event);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

async function onPaystackCharge(d) {
    const meta = d.metadata ?? {};
    const userId = Number(meta.user_id ?? 0);
    const planId = Number(meta.plan_id ?? 0);
    const subId = String(d.subscription_code ?? d.reference ?? '');

    const model =
        userId && planId
            ? await upsertSubscription('paystack', { userId, planId, subId, status: 'active' })
            : await findSubscription('paystack', subId);

    await recordTransaction('paystack', model, {
        txnId: String(d.reference ?? ''),
        amountCents: Number(d.amount ?? 0),
        currency: String(d.currency ?? 'NGN'),
        status: 'paid',
        payload: d,
    });
}

/* ------------------------------------------------------------- Cashfree */

export function createCashfreeGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const key = 'cashfree';
    const base = () =>
        testMode ? 'https://test.cashfree.com/api/v2' : 'https://api.cashfree.com/api/v2';
    const auth = () => ({
        'x-client-id': cred(creds, 'app_id'),
        'x-client-secret': cred(creds, 'secret_key'),
    });
    const isConfigured = () => cred(creds, 'app_id') !== '' && cred(creds, 'secret_key') !== '';

    return {
        key,
        name: () => 'Cashfree',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Cashfree is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const amount = Math.round((Number(priceCents) / 100) * 100) / 100;
            const currency = String(plan.currency_code ?? 'INR').toUpperCase();
            const planId = `plan_${plan.id}_${billingCycle}`;
            const subscriptionId = `sub_${user.id}_${plan.id}_${billingCycle}_${randomLower(6)}`;

            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 5);

            await postJson(`${base()}/subscription-plans`, {
                planId,
                planName: String(plan.name).slice(0, 40),
                type: 'PERIODIC',
                maxCycles: billingCycle === 'year' ? 10 : 120,
                amount,
                intervalType: billingCycle === 'year' ? 'year' : 'month',
                intervals: 1,
                currency,
            }, auth());

            const subRes = await postJson(`${base()}/subscriptions`, {
                subscriptionId,
                planId,
                customerName: user.name || `User ${user.id}`,
                customerEmail: user.email,
                customerPhone: user.phone ?? '9999999999',
                authAmount: 1,
                returnUrl: successUrl,
                expiresOn: expires.toISOString().slice(0, 19),
                notificationChannels: ['EMAIL'],
            }, auth());

            if (!subRes.ok || subRes.json?.status === 'ERROR') {
                console.error('Cashfree create subscription failed', { body: subRes.json });
                return { error: subRes.json?.message ?? 'Cashfree subscription creation failed.' };
            }

            const url = subRes.json?.authLink;
            if (!url) return { error: 'No authLink in Cashfree response.' };

            const subRef = String(subRes.json?.subReferenceId ?? subscriptionId);
            await upsertSubscription(key, {
                userId: user.id,
                planId: plan.id,
                subId: subRef,
                status: 'trialing',
            });

            return { url, subscription_id: subRef };
        },

        async handleWebhook(request) {
            const payload = await request.text();
            const secret = cred(creds, 'webhook_secret') || cred(creds, 'secret_key');
            const ts = request.headers.get('x-webhook-timestamp') ?? '';
            const sig = request.headers.get('x-webhook-signature') ?? '';

            if (secret === '' || sig === '' || ts === '') return badSignature(key);

            const expected = crypto
                .createHmac('sha256', secret)
                .update(ts + payload)
                .digest('base64');
            if (!hmacEquals(expected, sig)) return badSignature(key);

            let data;
            try {
                data = JSON.parse(payload);
            } catch {
                return invalidPayload();
            }

            const event = String(data.type ?? data.event ?? '').toUpperCase();
            const d = data.data ?? data;

            try {
                const status = String(d.subscriptionStatus ?? d.status ?? '').toUpperCase();
                if (event.includes('PAYMENT') && status !== 'CANCELLED') {
                    await onCashfreePayment(d);
                } else if (event.includes('CANCEL') || status === 'CANCELLED') {
                    await markCanceled(key, String(d.subReferenceId ?? ''));
                } else if (event.includes('STATUS')) {
                    const model = await findSubscription(key, String(d.subReferenceId ?? ''));
                    if (model) {
                        await prisma.subscription.update({
                            where: { id: model.id },
                            data: {
                                status: status === 'ACTIVE' ? 'active' : model.status,
                                updated_at: new Date(),
                            },
                        });
                    }
                }
            } catch (e) {
                return handlerError(key, e, event);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

async function onCashfreePayment(d) {
    const subRef = String(d.subReferenceId ?? '');
    const model = await findSubscription('cashfree', subRef);
    if (model) {
        await prisma.subscription.update({
            where: { id: model.id },
            data: { status: 'active', updated_at: new Date() },
        });
    }

    await recordTransaction('cashfree', model, {
        txnId: String(d.referenceId ?? d.paymentId ?? ''),
        amountCents: Math.round(Number(d.amount ?? 0) * 100),
        currency: String(d.currency ?? 'INR'),
        status: 'paid',
        payload: d,
    });
}

/* --------------------------------------------------------------- Xendit */

export function createXenditGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const BASE = 'https://api.xendit.co';
    const key = 'xendit';
    const auth = () => ({ Authorization: basicAuth(cred(creds, 'secret_key'), '') });
    const isConfigured = () => cred(creds, 'secret_key') !== '';

    // IDR and VND are zero-decimal at Xendit.
    const amount = (cents, currency) =>
        ['IDR', 'VND'].includes(String(currency).toUpperCase())
            ? Math.round(Number(cents) / 100)
            : Math.round(Number(cents)) / 100;

    return {
        key,
        name: () => 'Xendit',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Xendit is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const currency = String(plan.currency_code ?? 'IDR').toUpperCase();
            const ref = `sub-${user.id}-${plan.id}-${billingCycle}`;

            const customerRes = await postJson(`${BASE}/customers`, {
                reference_id: `cust-${user.id}`,
                type: 'INDIVIDUAL',
                email: user.email,
                individual_detail: { given_names: user.name || `User ${user.id}` },
            }, auth());
            if (!customerRes.ok) {
                console.error('Xendit create customer failed', { body: customerRes.json });
                return { error: customerRes.json?.message ?? 'Xendit customer creation failed.' };
            }

            const planRes = await postJson(`${BASE}/recurring/plans`, {
                reference_id: ref,
                customer_id: customerRes.json.id,
                recurring_action: 'PAYMENT',
                currency,
                amount: amount(priceCents, currency),
                schedule: {
                    reference_id: `sched-${ref}`,
                    interval: billingCycle === 'year' ? 'YEAR' : 'MONTH',
                    interval_count: 1,
                },
                immediate_action_type: 'FULL_AMOUNT',
                failed_cycle_action: 'STOP',
                metadata: {
                    user_id: String(user.id),
                    plan_id: String(plan.id),
                    billing_cycle: billingCycle,
                },
                success_return_url: successUrl,
                failure_return_url: cancelUrl,
            }, auth());
            if (!planRes.ok) {
                console.error('Xendit create recurring plan failed', { body: planRes.json });
                return { error: planRes.json?.message ?? 'Xendit recurring plan creation failed.' };
            }

            const actions = planRes.json?.actions ?? [];
            const authAction = actions.find((a) => a.action === 'AUTH' || a.url);
            if (!authAction?.url) return { error: 'No authorization URL in Xendit response.' };

            return { url: authAction.url, plan_id: planRes.json.id };
        },

        async handleWebhook(request) {
            const token = cred(creds, 'callback_token');
            if (token === '') {
                console.error(
                    'Xendit webhook rejected — no callback token configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Callback token not configured', { status: 400 });
            }

            if (!hmacEquals(token, request.headers.get('x-callback-token'))) return badSignature(key);

            let data;
            try {
                data = JSON.parse(await request.text());
            } catch {
                return invalidPayload();
            }

            const event = data.event ?? '';
            const resource = data.data ?? {};

            try {
                if (event === 'recurring.plan.activated') {
                    await onXenditPlanActivated(resource);
                } else if (['recurring.plan.inactivated', 'recurring.plan.deactivated'].includes(event)) {
                    await markCanceled(key, String(resource.id ?? ''));
                } else if (String(event).startsWith('recurring.cycle.succeeded')) {
                    const model = await findSubscription(key, String(resource.plan_id ?? ''));
                    await recordTransaction(key, model, {
                        txnId: String(resource.id ?? ''),
                        amountCents: Math.round(Number(resource.amount ?? 0) * 100),
                        currency: String(resource.currency ?? 'IDR'),
                        status: 'paid',
                        payload: resource,
                    });
                }
            } catch (e) {
                return handlerError(key, e, event);
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

async function onXenditPlanActivated(resource) {
    const meta = resource.metadata ?? {};
    await upsertSubscription('xendit', {
        userId: Number(meta.user_id ?? 0),
        planId: Number(meta.plan_id ?? 0),
        subId: String(resource.id ?? ''),
        status: 'active',
    });
}

/* ----------------------------------------------------------- MyFatoorah */

export function createMyFatoorahGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const key = 'myfatoorah';
    const base = () => {
        const configured = cred(creds, 'base_url').trim();
        if (configured !== '') return configured.replace(/\/+$/, '');
        return testMode ? 'https://apitest.myfatoorah.com' : 'https://api.myfatoorah.com';
    };
    const auth = () => ({ Authorization: `Bearer ${cred(creds, 'api_token')}` });
    const isConfigured = () => cred(creds, 'api_token') !== '';

    /** CustomerReference carries the ids back on the webhook. */
    const encodeRef = (user, plan, cycle) => `u${user.id}-p${plan.id}-${cycle}`;
    const decodeRef = (ref) => {
        const m = String(ref ?? '').match(/^u(\d+)-p(\d+)-(\w+)$/);
        return m ? { userId: Number(m[1]), planId: Number(m[2]), cycle: m[3] } : null;
    };

    return {
        key,
        name: () => 'MyFatoorah',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'MyFatoorah is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const res = await postJson(`${base()}/v2/SendPayment`, {
                CustomerName: user.name || `User ${user.id}`,
                InvoiceValue: Math.round((Number(priceCents) / 100) * 100) / 100,
                DisplayCurrencyIso: String(plan.currency_code ?? 'KWD').toUpperCase(),
                CustomerEmail: user.email,
                CustomerReference: encodeRef(user, plan, billingCycle),
                CallBackUrl: successUrl,
                ErrorUrl: cancelUrl,
                NotificationOption: 'LNK',
                RecurringModel: {
                    RecurringType: billingCycle === 'year' ? 'Yearly' : 'Monthly',
                    Iteration: billingCycle === 'year' ? 5 : 24,
                },
            }, auth());

            if (!res.ok || !res.json?.IsSuccess) {
                console.error('MyFatoorah SendPayment failed', { body: res.json });
                return { error: res.json?.Message ?? 'MyFatoorah payment creation failed.' };
            }

            const url = res.json?.Data?.InvoiceURL;
            if (!url) return { error: 'No invoice URL in MyFatoorah response.' };

            return {
                url,
                invoice_id: res.json?.Data?.InvoiceId,
                recurring_id: res.json?.Data?.RecurringId,
            };
        },

        async handleWebhook(request) {
            let data;
            try {
                data = JSON.parse(await request.text());
            } catch {
                return invalidPayload();
            }

            const secret = cred(creds, 'webhook_secret');
            const d = data.Data ?? {};

            if (secret === '') {
                console.error(
                    'MyFatoorah webhook rejected — no webhook secret configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('Webhook secret not configured', { status: 400 });
            }

            // MyFatoorah signs a comma-joined "key=value" string of the Data object.
            const canonical = Object.entries(d)
                .map(([k, v]) => `${k}=${v ?? ''}`)
                .join(',');
            const expected = crypto.createHmac('sha256', secret).update(canonical).digest('base64');
            if (!hmacEquals(expected, request.headers.get('myfatoorah-signature'))) {
                return badSignature(key);
            }

            const event = data.Event ?? data.EventType ?? '';
            try {
                const status = String(d.TransactionStatus ?? '').toUpperCase();
                if (['SUCCESS', 'SUCCSS', 'PAID'].includes(status)) {
                    const ref = decodeRef(d.CustomerReference);
                    const subId = String(d.RecurringId ?? d.InvoiceId ?? '');

                    const model = ref
                        ? await upsertSubscription(key, {
                              userId: ref.userId,
                              planId: ref.planId,
                              subId,
                              status: 'active',
                              renewsAt: nextRenewal(ref.cycle),
                          })
                        : await findSubscription(key, subId);

                    await recordTransaction(key, model, {
                        txnId: String(d.TransactionId ?? d.InvoiceId ?? ''),
                        amountCents: Math.round(Number(d.InvoiceValue ?? 0) * 100),
                        currency: String(d.Currency ?? 'KWD'),
                        status: 'paid',
                        payload: d,
                    });
                } else if (['FAILED', 'CANCELED', 'CANCELLED'].includes(status)) {
                    console.info('MyFatoorah non-success transaction', { status });
                }
            } catch (e) {
                return handlerError(key, e, String(event));
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!isConfigured() || !subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

/* ------------------------------------------------------------------ Tap */

export function createTapGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const BASE = 'https://api.tap.company/v2';
    const key = 'tap';
    const auth = () => ({ Authorization: `Bearer ${cred(creds, 'secret_key')}` });
    const isConfigured = () => cred(creds, 'secret_key') !== '';

    return {
        key,
        name: () => 'Tap',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Tap is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const res = await postJson(`${BASE}/charges`, {
                amount: Math.round((Number(priceCents) / 100) * 100) / 100,
                currency: String(plan.currency_code ?? 'KWD').toUpperCase(),
                threeDSecure: true,
                description: `${plan.name} (${billingCycle})`,
                customer: { first_name: user.name || `User ${user.id}`, email: user.email },
                source: { id: 'src_all' },
                redirect: { url: successUrl },
                post: { url: webhookUrl },
                metadata: {
                    user_id: String(user.id),
                    plan_id: String(plan.id),
                    billing_cycle: billingCycle,
                },
            }, auth());

            if (!res.ok) {
                console.error('Tap create charge failed', { body: res.json });
                return {
                    error:
                        res.json?.errors?.[0]?.description ??
                        res.json?.message ??
                        'Tap charge creation failed.',
                };
            }

            const url = res.json?.transaction?.url;
            if (!url) return { error: 'No redirect URL in Tap response.' };
            return { url, charge_id: res.json?.id };
        },

        async handleWebhook(request) {
            let data;
            try {
                data = JSON.parse(await request.text());
            } catch {
                return invalidPayload();
            }

            const secret = cred(creds, 'secret_key');
            if (secret === '') return badSignature(key);

            // Tap's hashstring: x_id, x_amount, x_currency, x_gateway_reference,
            // x_payment_reference, x_status, x_created — joined and HMAC-SHA256'd.
            const canonical =
                `x_id${data.id ?? ''}` +
                `x_amount${Number(data.amount ?? 0).toFixed(3)}` +
                `x_currency${data.currency ?? ''}` +
                `x_gateway_reference${data.reference?.gateway ?? ''}` +
                `x_payment_reference${data.reference?.payment ?? ''}` +
                `x_status${data.status ?? ''}` +
                `x_created${data.transaction?.created ?? ''}`;

            if (!hmacEquals(hmacSha256(canonical, secret), request.headers.get('hashstring'))) {
                return badSignature(key);
            }

            try {
                if (String(data.status ?? '').toUpperCase() === 'CAPTURED') {
                    const meta = data.metadata ?? {};
                    const userId = Number(meta.user_id ?? 0);
                    const planId = Number(meta.plan_id ?? 0);
                    const cycle = String(meta.billing_cycle ?? 'month');
                    const chargeId = String(data.id ?? '');

                    const sub = await upsertSubscription(key, {
                        userId,
                        planId,
                        subId: chargeId,
                        status: 'active',
                        endsAt: nextRenewal(cycle),
                    });

                    await recordTransaction(key, sub, {
                        txnId: chargeId,
                        amountCents: Math.round(Number(data.amount ?? 0) * 100),
                        currency: String(data.currency ?? 'KWD'),
                        status: 'paid',
                        payload: data,
                    });
                }
            } catch (e) {
                return handlerError(key, e, String(data.status ?? ''));
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

/* --------------------------------------------------------------- Paymob */

export function createPaymobGateway(creds, testMode, successUrl, cancelUrl, webhookUrl) {
    const BASE = 'https://accept.paymob.com/api';
    const key = 'paymob';
    const isConfigured = () =>
        cred(creds, 'api_key') !== '' &&
        cred(creds, 'integration_id') !== '' &&
        cred(creds, 'iframe_id') !== '';

    return {
        key,
        name: () => 'Paymob',
        isConfigured,

        async createCheckout(user, plan, billingCycle) {
            if (!isConfigured()) return { error: 'Paymob is not configured.' };

            const priceCents = priceCentsForCycle(plan, billingCycle);
            if (!priceCents || Number(priceCents) <= 0) {
                return { error: 'Plan has no price for this billing cycle.' };
            }

            const authRes = await postJson(`${BASE}/auth/tokens`, { api_key: cred(creds, 'api_key') });
            if (!authRes.ok) {
                console.error('Paymob auth failed', { body: authRes.json });
                return { error: 'Paymob authentication failed.' };
            }
            const token = authRes.json.token;

            const merchantOrderId = `u${user.id}-p${plan.id}-${billingCycle}-${randomLower(8)}`;
            const currency = String(plan.currency_code ?? 'EGP').toUpperCase();

            const orderRes = await postJson(`${BASE}/ecommerce/orders`, {
                auth_token: token,
                delivery_needed: false,
                amount_cents: Number(priceCents),
                currency,
                merchant_order_id: merchantOrderId,
                items: [],
            });
            if (!orderRes.ok) {
                console.error('Paymob order failed', { body: orderRes.json });
                return { error: 'Paymob order creation failed.' };
            }

            const nameParts = String(user.name || 'User').trim().split(' ');
            const keyRes = await postJson(`${BASE}/acceptance/payment_keys`, {
                auth_token: token,
                amount_cents: Number(priceCents),
                expiration: 3600,
                order_id: orderRes.json.id,
                currency,
                integration_id: parseInt(cred(creds, 'integration_id'), 10),
                lock_order_when_paid: true,
                billing_data: {
                    first_name: nameParts[0] || 'NA',
                    last_name: nameParts.slice(1).join(' ') || 'NA',
                    email: user.email,
                    phone_number: String(user.phone ?? 'NA'),
                    apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA',
                    shipping_method: 'NA', postal_code: 'NA', city: 'NA',
                    country: 'NA', state: 'NA',
                },
            });
            if (!keyRes.ok) {
                console.error('Paymob payment key failed', { body: keyRes.json });
                return { error: 'Paymob payment key creation failed.' };
            }

            return {
                url: `${BASE}/acceptance/iframes/${cred(creds, 'iframe_id')}?payment_token=${keyRes.json.token}`,
                order_id: orderRes.json.id,
            };
        },

        async handleWebhook(request) {
            const url = new URL(request.url);
            let body;
            try {
                body = JSON.parse(await request.text());
            } catch {
                return invalidPayload();
            }

            const obj = body.obj;
            if (!obj || typeof obj !== 'object') return invalidPayload();

            const hmacSecret = cred(creds, 'hmac_secret');
            if (hmacSecret === '') {
                console.error(
                    'Paymob webhook rejected — no HMAC secret configured. Set it in Admin → Payment Gateways.',
                );
                return new Response('HMAC secret not configured', { status: 400 });
            }

            if (!verifyPaymobHmac(obj, url.searchParams.get('hmac') ?? '', hmacSecret)) {
                return badSignature(key);
            }

            try {
                if (obj.success === true && obj.pending === false) {
                    // merchant_order_id encodes u{user}-p{plan}-{cycle}-{rand}.
                    const ref = String(obj.order?.merchant_order_id ?? '');
                    const m = ref.match(/^u(\d+)-p(\d+)-(\w+)-/);
                    const orderId = String(obj.order?.id ?? '');

                    const sub = m
                        ? await upsertSubscription(key, {
                              userId: Number(m[1]),
                              planId: Number(m[2]),
                              subId: orderId,
                              status: 'active',
                              endsAt: nextRenewal(m[3]),
                          })
                        : await findSubscription(key, orderId);

                    await recordTransaction(key, sub, {
                        txnId: String(obj.id ?? ''),
                        amountCents: Number(obj.amount_cents ?? 0),
                        currency: String(obj.currency ?? 'EGP'),
                        status: 'paid',
                        payload: obj,
                    });
                }
            } catch (e) {
                return handlerError(key, e, 'transaction');
            }

            return okResponse();
        },

        async cancel(subscription) {
            if (!subscription?.gateway_subscription_id) return false;
            await markCanceled(key, subscription.gateway_subscription_id);
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

/** Paymob concatenates a fixed field order, then HMAC-SHA512s it. */
function verifyPaymobHmac(obj, received, secret) {
    const fields = [
        obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
        obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
        obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
        obj.is_voided, obj.order?.id, obj.owner, obj.pending,
        obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type, obj.success,
    ];

    const canonical = fields
        .map((v) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v ?? '')))
        .join('');

    return hmacEquals(hmacSha512(canonical, secret), received);
}
