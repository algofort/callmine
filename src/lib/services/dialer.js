import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { balance } from '@/lib/services/credits';
import { acquireKey, poolCapacity, poolLoad, releaseKey } from '@/lib/services/elevenlabs';
import {
    defaultEngine,
    engineCatalog,
    telephonyKeyFor,
    voiceKeyFor,
} from '@/lib/services/integrations';
import { driverForEngine } from '@/lib/services/telephony';
import { claimDue, failOrRetry, release } from '@/lib/services/call-queue';
import { CALL_STATUS } from '@/lib/webhooks/twiml';

/**
 * Port of App\Services\Calling\Dialer + App\Jobs\PlaceCallJob +
 * App\Console\Commands\ReapStuckCallsCommand.
 */

function webhookUrl(provider, kind, callId) {
    return `${String(config.app.url).replace(/\/+$/, '')}/webhooks/${provider}/${kind}?c=${callId}`;
}

/** — bounded by ElevenLabs pool headroom. */
export async function dispatchDue() {
    const available = Math.min(
        Math.max(0, (await poolCapacity()) - (await poolLoad())),
        config.calling.dialer_concurrency,
    );
    if (available < 1) return 0;

    const jobs = await claimDue(available);

    for (const job of jobs) {
        await placeCall(job.id).catch((e) => console.error('[dialer] place failed:', e?.message));
    }

    return jobs.length;
}

export async function placeCall(jobId) {
    const job = await prisma.callQueueJob.findUnique({
        where: { id: BigInt(jobId) },
        include: { campaigns: true, agents: true, contacts: true, phone_numbers: true, clients: true },
    });

    if (!job || job.status !== 'processing') return;

    // A campaign paused after the job was claimed goes back on the queue.
    if (job.campaigns && job.campaigns.status === 'paused') {
        await release(job);
        return;
    }

    if (!job.clients || (await balance(job.client_id)) <= 0) {
        await failOrRetry(job, 'insufficient_credits');
        return;
    }

    const contact = job.contacts;
    const number = job.phone_numbers;
    if (!contact || !number) {
        await failOrRetry(job, 'missing_contact_or_number');
        return;
    }

    let engine = job.agents?.engine || defaultEngine();
    if (!engineCatalog()[engine]) engine = defaultEngine();

    // Reserve a concurrency slot up front for ElevenLabs engines; if the pool is
    // saturated the job goes back on the queue rather than failing.
    let key = null;
    if (voiceKeyFor(engine) === 'elevenlabs') {
        key = await acquireKey();
        if (!key) {
            await release(job);
            return;
        }
    }

    let slotHandedOff = false;

    try {
        const call = await prisma.call.create({
            data: {
                client_id: job.client_id,
                campaign_id: job.campaign_id,
                agent_id: job.agent_id,
                contact_id: contact.id,
                phone_number_id: number.id,
                direction: 'outbound',
                engine,
                status: CALL_STATUS.RINGING,
                meta: {
                    key_id: key ? Number(key.id) : null,
                    engine,
                    queue_job_id: Number(job.id),
                    turns: [],
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        const provider = telephonyKeyFor(engine);
        const result = await driverForEngine(engine).placeCall(
            contact.phone,
            number.e164_number,
            webhookUrl(provider, 'voice', Number(call.id)),
            webhookUrl(provider, 'status', Number(call.id)),
        );

        if (!result.ok) {
            await prisma.call.update({
                where: { id: call.id },
                data: {
                    status: CALL_STATUS.FAILED,
                    outcome: result.error ?? 'place_failed',
                    ended_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await failOrRetry(job, result.error ?? 'place_failed');
            return;
        }

        await prisma.call.update({
            where: { id: call.id },
            data: { twilio_call_sid: result.sid ?? null, started_at: new Date(), updated_at: new Date() },
        });

        // The slot now belongs to the live call; ProcessCallResult releases it.
        slotHandedOff = true;
    } catch (e) {
        console.error('[dialer] placeCall exception:', e?.message);
        await failOrRetry(job, 'exception');
    } finally {
        if (key && !slotHandedOff) await releaseKey(key);
    }
}

/** ReapStuckCallsCommand — calls that never got a terminal webhook. */
export async function reapStuckCalls(minutes = 30) {
    const cutoff = new Date(Date.now() - minutes * 60000);
    let reaped = 0;

    const calls = await prisma.call.findMany({
        where: {
            status: { in: [CALL_STATUS.RINGING, CALL_STATUS.IN_PROGRESS] },
            created_at: { lt: cutoff },
        },
        orderBy: { id: 'asc' },
        take: 500,
    });

    for (const call of calls) {
        await prisma.call.update({
            where: { id: call.id },
            data: {
                status: CALL_STATUS.FAILED,
                outcome: 'stuck_no_webhook',
                ended_at: new Date(),
                updated_at: new Date(),
            },
        });

        const keyId = call.meta?.key_id;
        if (keyId) {
            const key = await prisma.elevenLabsKey.findUnique({ where: { id: BigInt(keyId) } }).catch(() => null);
            if (key) await releaseKey(key);
        }

        const jobId = call.meta?.queue_job_id;
        if (jobId) {
            const job = await prisma.callQueueJob.findUnique({ where: { id: BigInt(jobId) } }).catch(() => null);
            if (job) await failOrRetry(job, 'stuck_no_webhook');
        }

        reaped++;
    }

    return reaped;
}

/** GrantMonthlyCreditsCommand — plan credits for every active customer. */
export async function grantMonthlyCredits() {
    const { monthlyGrantForPlan } = await import('@/lib/services/credits');

    const clients = await prisma.client.findMany({ where: { status: 'active' }, select: { id: true } });

    let granted = 0;
    for (const client of clients) {
        const entry = await monthlyGrantForPlan(client.id).catch(() => null);
        if (entry) granted++;
    }
    return granted;
}

/** SyncSubscriptionsCommand — reconcile status in case a webhook was missed. */
export async function syncSubscriptions() {
    const { billingRegistry } = await import('@/lib/services/billing');
    const registry = await billingRegistry();

    const subs = await prisma.subscription.findMany({
        where: { status: { in: ['active', 'trialing', 'past_due'] } },
    });

    let synced = 0;
    for (const sub of subs) {
        const gateway = registry.get(sub.gateway);
        if (!gateway) continue;
        if (await gateway.sync(sub).catch(() => false)) synced++;
    }
    return synced;
}
