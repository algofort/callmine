import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { resolveSafeTarget } from '@/lib/services/outbound-guard';

/**
 * Port of App\Services\Webhooks\WebhookDispatcher + App\Jobs\DispatchWebhookJob.
 *
 * Delivery runs inline but never blocks the caller —
 * `dispatchWebhook()` returns as soon as the matching hooks are selected and the
 * sends are kicked off.
 */

export const WEBHOOK_EVENTS = {
    CALL_COMPLETED: 'call.completed',
    LEAD_QUALIFIED: 'lead.qualified',
    CAMPAIGN_STATUS_CHANGED: 'campaign.status_changed',
    AGENT_PERFORMANCE: 'agent.performance',
};

export const AVAILABLE_EVENTS = Object.values(WEBHOOK_EVENTS);

/** — one delivery attempt, always logged. */
export async function deliverWebhook(webhookId, event, payload) {
    const webhook = await prisma.webhook.findUnique({ where: { id: BigInt(webhookId) } });
    if (!webhook || !webhook.is_active) return;

    const body = JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
    });

    const signature = crypto
        .createHmac('sha256', String(webhook.secret ?? ''))
        .update(body)
        .digest('hex');

    // SSRF guard: a non-public target is logged as blocked and never retried.
    const target = await resolveSafeTarget(String(webhook.target_url));
    if (!target) {
        await logDelivery(webhook.id, event, payload, null);
        await prisma.webhook.update({
            where: { id: webhook.id },
            data: { last_delivery_at: new Date(), last_status: 'blocked', updated_at: new Date() },
        });
        return;
    }

    let code = 0;
    try {
        const res = await fetch(webhook.target_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CallMineAI-Event': event,
                'X-CallMineAI-Signature': signature,
            },
            body,
            signal: AbortSignal.timeout(15000),
        });
        code = res.status;
    } catch {
        code = 0;
    }

    await logDelivery(webhook.id, event, payload, code || null);
    await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
            last_delivery_at: new Date(),
            last_status: code >= 200 && code < 300 ? 'success' : 'failed',
            updated_at: new Date(),
        },
    });
}

async function logDelivery(webhook_id, event, payload, response_code) {
    await prisma.webhookDelivery
        .create({
            data: {
                webhook_id,
                event,
                payload,
                response_code,
                attempts: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
        })
        .catch(() => {});
}

/**
 * — every active hook for the client that either
 * targets this campaign or is campaign-agnostic, and subscribes to this event
 * (an empty `events` array means "all events").
 */
export async function dispatchWebhook(event, clientId, payload, campaignId = null) {
    const hooks = await prisma.webhook.findMany({
        where: {
            client_id: BigInt(clientId),
            is_active: true,
            OR: [{ campaign_id: null }, ...(campaignId ? [{ campaign_id: BigInt(campaignId) }] : [])],
        },
    });

    const matching = hooks.filter((w) => {
        const events = w.events ?? [];
        return events.length === 0 || events.includes(event);
    });

    // Fire and forget — a slow subscriber must not stall the call pipeline.
    for (const webhook of matching) {
        deliverWebhook(webhook.id, event, payload).catch((e) =>
            console.error('[webhook] delivery failed:', e?.message),
        );
    }

    return matching.length;
}
