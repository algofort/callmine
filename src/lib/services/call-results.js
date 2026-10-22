import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { chargeForCall } from '@/lib/services/credits';
import { releaseKey } from '@/lib/services/elevenlabs';
import { defaultAiProvider, openAiKey } from '@/lib/services/ai';
import { twilio } from '@/lib/services/telephony';
import { markCompleted, failOrRetry } from '@/lib/services/call-queue';
import { dispatchWebhook, WEBHOOK_EVENTS } from '@/lib/services/webhook-dispatcher';
import { CALL_STATUS } from '@/lib/webhooks/twiml';

/**
 * Port of App\Jobs\ProcessCallResultJob + AnalyzeCallJob +
 * App\Services\Calling\CallAnalysisService.
 */

const STATUS_MAP = {
    completed: CALL_STATUS.COMPLETED,
    busy: CALL_STATUS.BUSY,
    'no-answer': CALL_STATUS.NO_ANSWER,
    failed: CALL_STATUS.FAILED,
    canceled: CALL_STATUS.FAILED,
};

const TERMINAL = [
    CALL_STATUS.COMPLETED,
    CALL_STATUS.FAILED,
    CALL_STATUS.NO_ANSWER,
    CALL_STATUS.BUSY,
];

const SENTIMENTS = ['positive', 'neutral', 'negative'];
const QUALIFICATIONS = ['hot', 'warm', 'cold', 'unqualified'];

export async function processCallResult(callId, carrierStatus, durationSeconds = 0) {
    const mapped = STATUS_MAP[carrierStatus] ?? CALL_STATUS.FAILED;
    const connected = mapped === CALL_STATUS.COMPLETED;

    // Lock the row so a duplicate carrier callback cannot finalize twice.
    const call = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
            SELECT id, status, started_at FROM calls WHERE id = ${BigInt(callId)} FOR UPDATE`;
        const row = rows?.[0];
        if (!row || TERMINAL.includes(row.status)) return null;

        return tx.call.update({
            where: { id: BigInt(callId) },
            data: {
                status: mapped,
                duration_seconds: durationSeconds,
                ended_at: new Date(),
                started_at: row.started_at ?? new Date(Date.now() - durationSeconds * 1000),
                updated_at: new Date(),
            },
        });
    });

    if (!call) return; // gone, or already finalized by a concurrent webhook

    // Give the ElevenLabs concurrency slot back to the pool.
    const keyId = call.meta?.key_id;
    if (keyId) {
        const key = await prisma.elevenLabsKey.findUnique({ where: { id: BigInt(keyId) } }).catch(() => null);
        if (key) await releaseKey(key);
    }

    if (connected) {
        await chargeForCall(call).catch((e) => console.warn('[call] charge failed:', e?.message));
        await analyzeCall(call.id).catch((e) => console.warn('[call] analysis failed:', e?.message));
    }

    const jobId = call.meta?.queue_job_id;
    if (jobId) {
        const job = await prisma.callQueueJob.findUnique({ where: { id: BigInt(jobId) } }).catch(() => null);
        if (job) {
            if (connected) await markCompleted(job);
            else await failOrRetry(job, mapped);
        }
    }

    if (call.campaign_id && call.contact_id) {
        await prisma.$executeRaw`
            UPDATE campaign_contact
            SET call_status = ${connected ? 'completed' : 'failed'},
                last_call_id = ${call.id},
                attempts = attempts + 1,
                updated_at = NOW()
            WHERE campaign_id = ${call.campaign_id} AND contact_id = ${call.contact_id}`;
    }

    await refreshCampaign(call.campaign_id);

    // Outbound integrations.
    const fresh = await prisma.call.findUnique({ where: { id: call.id } });
    if (fresh?.client_id) {
        await dispatchWebhook(
            WEBHOOK_EVENTS.CALL_COMPLETED,
            fresh.client_id,
            {
                call_id: Number(fresh.id),
                status: fresh.status,
                duration_seconds: fresh.duration_seconds,
                sentiment: fresh.sentiment,
                qualification: fresh.qualification,
                summary: fresh.summary,
            },
            fresh.campaign_id,
        );

        if (['hot', 'warm'].includes(fresh.qualification)) {
            await dispatchWebhook(
                WEBHOOK_EVENTS.LEAD_QUALIFIED,
                fresh.client_id,
                { call_id: Number(fresh.id), qualification: fresh.qualification },
                fresh.campaign_id,
            );
        }
    }

    // Advance the contact's pipeline stage after a connected call.
    if (connected && fresh?.contact_id) {
        await advanceContactStage(fresh);
    }
}

export async function refreshCampaign(campaignId) {
    if (!campaignId) return;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    const [total, connected, qualified, failed] = await Promise.all([
        prisma.call.count({ where: { campaign_id: campaignId } }),
        prisma.call.count({ where: { campaign_id: campaignId, status: CALL_STATUS.COMPLETED } }),
        prisma.call.count({ where: { campaign_id: campaignId, qualification: { in: ['hot', 'warm'] } } }),
        prisma.call.count({
            where: {
                campaign_id: campaignId,
                status: { in: [CALL_STATUS.FAILED, CALL_STATUS.NO_ANSWER, CALL_STATUS.BUSY] },
            },
        }),
    ]);

    await prisma.campaign.update({
        where: { id: campaignId },
        data: { stats: { total, connected, qualified, failed }, updated_at: new Date() },
    });

    const remaining = await prisma.callQueueJob.count({
        where: {
            campaign_id: campaignId,
            status: { in: ['pending', 'scheduled', 'processing'] },
        },
    });

    if (remaining === 0 && campaign.status === 'active') {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'completed', updated_at: new Date() },
        });
    }
}

/**
 * — never move backwards, and never override a
 * Won/Lost outcome a human set.
 */
async function advanceContactStage(call) {
    const contact = await prisma.contact.findUnique({ where: { id: call.contact_id } });
    if (!contact) return;

    const current = contact.pipeline_stage ?? 'new';
    if (['won', 'lost'].includes(current)) return;

    const target = ['hot', 'warm'].includes(call.qualification) ? 'qualified' : 'contacted';

    const order = ['new', 'contacted', 'qualified', 'won', 'lost'];
    if (order.indexOf(target) <= order.indexOf(current)) return;

    await prisma.contact.update({
        where: { id: contact.id },
        data: { pipeline_stage: target, updated_at: new Date() },
    });
}

/* ------------------------------------------------------- CallAnalysis */

/** AnalyzeCallJob + */
export async function analyzeCall(callId) {
    const call = await prisma.call.findUnique({ where: { id: BigInt(callId) } });
    if (!call) return;

    let transcript = String(call.transcript ?? '').trim();

    if (transcript === '' && call.recording_url) {
        transcript = (await transcribe(call)) ?? '';
    }

    if (transcript === '') {
        await prisma.call.update({
            where: { id: call.id },
            data: { sentiment: 'neutral', qualification: 'unqualified', updated_at: new Date() },
        });
        return;
    }

    const provider = await defaultAiProvider();
    const result = provider
        ? await llmAnalyze(provider, transcript)
        : {
              summary: transcript.slice(0, 200),
              sentiment: 'neutral',
              qualification: 'unqualified',
          };

    await prisma.call.update({
        where: { id: call.id },
        data: {
            transcript,
            summary: result.summary,
            sentiment: SENTIMENTS.includes(result.sentiment) ? result.sentiment : 'neutral',
            qualification: QUALIFICATIONS.includes(result.qualification)
                ? result.qualification
                : 'unqualified',
            updated_at: new Date(),
        },
    });
}

async function llmAnalyze(provider, transcript) {
    const prompt =
        'You are analyzing an outbound AI phone call transcript. Respond with ONLY a JSON object: ' +
        '{"summary": string (1-2 sentences), "sentiment": "positive|neutral|negative", ' +
        `"qualification": "hot|warm|cold|unqualified"}.\n\nTranscript:\n${transcript.slice(0, 6000)}`;

    try {
        const res = await provider.complete(prompt, { max_tokens: 300, temperature: 0 });
        const json = parseJson(res.text ?? '');

        return {
            summary: json.summary ?? transcript.slice(0, 200),
            sentiment: String(json.sentiment ?? 'neutral').toLowerCase(),
            qualification: String(json.qualification ?? 'unqualified').toLowerCase(),
        };
    } catch (e) {
        console.warn('Call analysis failed:', e?.message);
        return { summary: transcript.slice(0, 200), sentiment: 'neutral', qualification: 'unqualified' };
    }
}

function parseJson(text) {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
        const decoded = JSON.parse(match[0]);
        return decoded && typeof decoded === 'object' ? decoded : {};
    } catch {
        return {};
    }
}

/** Whisper transcription of a recording when the live transcript is empty. */
async function transcribe(call) {
    const key = await openAiKey();
    if (!key) return null;

    try {
        const body = await downloadRecording(call);
        if (!body) return null;

        const form = new FormData();
        form.append('file', new Blob([body], { type: 'audio/mpeg' }), 'recording.mp3');
        form.append('model', 'whisper-1');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}` },
            body: form,
            signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) return null;
        const json = await res.json();
        return String(json.text ?? '');
    } catch (e) {
        console.warn('Whisper transcription failed:', e?.message);
        return null;
    }
}

async function downloadRecording(call) {
    const url = String(call.recording_url ?? '');

    if (url.includes('twilio.com')) {
        let sid = call.recording_sid;
        if (!sid) sid = url.match(/Recordings\/(RE[a-f0-9]+)/i)?.[1] ?? null;

        const audio = sid ? await twilio.fetchRecording(sid) : null;
        return audio?.body ?? null;
    }

    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch {
        return null;
    }
}

export { config };
