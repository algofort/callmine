import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { sendTemplateMail } from '@/lib/services/mail';

/**
 * Port of App\Services\Billing\AbstractHttpGateway — the persistence half every
 * gateway shares: subscription upsert, transaction recording, mail notification.
 *
 * Each gateway is a plain object `{ key, name, isConfigured, createCheckout,
 * handleWebhook, cancel, sync, fulfillCheckoutSession }`, built by a factory
 * taking (creds, testMode, successUrl, cancelUrl, webhookUrl).
 */

export function cred(creds, key, fallback = '') {
    const v = creds?.[key] ?? fallback;
    return typeof v === 'object' ? fallback : String(v ?? fallback);
}

export function successUrlWith(successUrl, param, value) {
    const sep = successUrl.includes('?') ? '&' : '?';
    return `${successUrl}${sep}${param}=${encodeURIComponent(value)}`;
}

export function okResponse(body = 'OK') {
    return new Response(body, { status: 200 });
}

export function badSignature(key) {
    console.warn(`${key} webhook signature verification failed`);
    return new Response('Invalid signature', { status: 400 });
}

export function handlerError(key, e, event = '') {
    console.error(`${key} webhook handler failed`, { event, error: e?.message });
    return new Response('Handler error', { status: 500 });
}

export async function upsertSubscription(
    gatewayKey,
    { userId, planId, subId, status = 'active', renewsAt = null, endsAt = null },
) {
    if (!userId || !planId || !subId) return null;

    const where = {
        user_id: BigInt(userId),
        gateway: gatewayKey,
        gateway_subscription_id: String(subId),
    };

    const existing = await prisma.subscription.findFirst({ where });
    const values = {
        plan_id: BigInt(planId),
        status,
        starts_at: new Date(),
        ends_at: endsAt,
        renews_at: renewsAt,
        updated_at: new Date(),
    };

    const sub = existing
        ? await prisma.subscription.update({ where: { id: existing.id }, data: values })
        : await prisma.subscription.create({ data: { ...where, ...values, created_at: new Date() } });

    if (status === 'active') {
        await notify('subscription_confirmation', userId, { plan_id: planId });
    }

    return sub;
}

export async function markCanceled(gatewayKey, subId) {
    if (!subId) return;
    await prisma.subscription.updateMany({
        where: { gateway: gatewayKey, gateway_subscription_id: String(subId) },
        data: { status: 'canceled', ends_at: new Date(), updated_at: new Date() },
    });
}

/** — idempotent on the gateway txn id. */
export async function recordTransaction(
    gatewayKey,
    subscription,
    { txnId, amountCents, currency, status = 'paid', payload = {} },
) {
    if (txnId) {
        const exists = await prisma.paymentTransaction.findFirst({
            where: { gateway: gatewayKey, gateway_transaction_id: String(txnId) },
        });
        if (exists) return;
    }

    await prisma.paymentTransaction.create({
        data: {
            user_id: subscription?.user_id ?? null,
            subscription_id: subscription?.id ?? null,
            gateway: gatewayKey,
            gateway_transaction_id: txnId ? String(txnId) : null,
            amount_cents: BigInt(Math.round(amountCents)),
            currency_code: String(currency).toUpperCase(),
            status,
            payload,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    if (status === 'paid' && subscription?.user_id) {
        await notify('payment_success', subscription.user_id);
    }
}

export async function findSubscription(gatewayKey, subId) {
    if (!subId) return null;
    return prisma.subscription.findFirst({
        where: { gateway: gatewayKey, gateway_subscription_id: String(subId) },
    });
}

export async function notify(template, userId, extra = {}) {
    try {
        const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
        if (!user) return;

        const vars = { app_name: config.app.name, user_name: user.name };

        if (extra.plan_id) {
            const plan = await prisma.plan.findUnique({ where: { id: BigInt(extra.plan_id) } });
            if (plan) vars.plan_name = plan.name;
        }

        await sendTemplateMail(template, user.email, vars);
    } catch (e) {
        console.warn('[billing] notification failed:', e?.message);
    }
}

/** Constant-time HMAC comparison used by several webhook verifiers. */
export function hmacEquals(expected, received) {
    if (!expected || !received) return false;
    const a = Buffer.from(String(expected));
    const b = Buffer.from(String(received));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export function hmacSha256(body, secret, encoding = 'hex') {
    return crypto.createHmac('sha256', String(secret)).update(body).digest(encoding);
}

export function hmacSha512(body, secret, encoding = 'hex') {
    return crypto.createHmac('sha512', String(secret)).update(body).digest(encoding);
}

/** Resolve the plan + billing cycle metadata a checkout carried back. */
export async function planFromMetadata(metadata) {
    const planId = metadata?.plan_id ?? metadata?.planId;
    if (!planId) return null;
    return prisma.plan.findUnique({ where: { id: BigInt(planId) } }).catch(() => null);
}

/** Add one month/year to `from`, matching /addYear(). */
export function nextRenewal(cycle, from = new Date()) {
    const d = new Date(from);
    if (cycle === 'year') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d;
}
