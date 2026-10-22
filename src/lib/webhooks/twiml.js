import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { audioUrl } from '@/lib/services/call-speech';
import { reply as agentReply } from '@/lib/services/agent-conversation';

/**
 * Shared TwiML / Plivo-XML building and the in-call turn bookkeeping used by
 * both carrier webhook controllers.
 */

export const CALL_STATUS = {
    QUEUED: 'queued',
    RINGING: 'ringing',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    NO_ANSWER: 'no_answer',
    BUSY: 'busy',
};

export function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function twiml(body) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
    });
}

export function gatherAction(callId, provider = 'twilio') {
    return `${String(config.app.url).replace(/\/+$/, '')}/webhooks/${provider}/gather?c=${callId}`;
}

/** `<Play>` the synthesized line, or fall back to the carrier voice. */
export async function say(call, text) {
    const url = await audioUrl(call, text);
    if (url) return `<Play>${escapeXml(url)}</Play>`;

    return `<Say voice="${escapeXml(config.voice.fallback_carrier_voice)}">${escapeXml(text)}</Say>`;
}

export async function gatherTwiml(call, text) {
    const action = gatherAction(Number(call.id), 'twilio');

    return (
        `<Gather input="speech" speechTimeout="auto" action="${escapeXml(action)}" method="POST">` +
        `${await say(call, text)}</Gather>` +
        `<Redirect method="POST">${escapeXml(action)}</Redirect>`
    );
}

/**
 * Appends one turn to the call's meta + transcript and accrues a rough LLM cost.
 * Mirrors .
 */
export async function appendTurn(call, role, text, tokens = 0) {
    const meta = call.meta ?? {};
    meta.turns = [...(meta.turns ?? []), { role, text }];

    const transcript = `${call.transcript ?? ''}\n${role === 'agent' ? 'Agent' : 'Caller'}: ${text}`.trim();
    const llmCost = Number(call.llm_cost_cents ?? 0) + Math.ceil(tokens / 1000);

    return prisma.call.update({
        where: { id: call.id },
        data: { meta, transcript, llm_cost_cents: llmCost, updated_at: new Date() },
    });
}

/** Loads a call with the relations the conversation needs. */
export function loadCall(id) {
    if (!id) return null;
    return prisma.call
        .findUnique({
            where: { id: BigInt(id) },
            include: { agents: true, campaigns: true, contacts: true },
        })
        .catch(() => null);
}

/**
 * The shared body of the `gather` step: record the caller's speech, ask the LLM
 * for the next line, and decide whether to keep going or hang up.
 *
 * Returns `{ text, end }`; the caller renders it in its own XML dialect.
 */
export async function nextTurn(call, speech) {
    const turns = call.meta?.turns ?? [];
    const turnCount = turns.filter((t) => t.role === 'agent').length;

    let current = call;
    if (speech !== '') current = await appendTurn(current, 'caller', speech);

    if (!call.agents || turnCount >= config.calling.max_turns) {
        const line = 'Thank you for your time. Goodbye.';
        await appendTurn(current, 'agent', line);
        return { text: line, end: true };
    }

    const fresh = await prisma.call.findUnique({ where: { id: call.id } });

    const result = await agentReply(
        call.agents,
        call.campaigns,
        call.contacts,
        fresh?.meta?.turns ?? [],
        speech || '(no response)',
    );

    // Two consecutive LLM failures end the call gracefully rather than looping.
    const meta = fresh?.meta ?? {};
    if (result.error) {
        meta.last_reply_error = result.error;
        meta.reply_error_streak = Number(meta.reply_error_streak ?? 0) + 1;
    } else {
        meta.reply_error_streak = 0;
    }

    current = await prisma.call.update({
        where: { id: call.id },
        data: { meta, updated_at: new Date() },
    });

    if (Number(meta.reply_error_streak ?? 0) >= 2) {
        const line =
            "I'm sorry, I'm having some technical trouble on my end. I'll have someone follow up with you. Thanks for your time.";
        await appendTurn(current, 'agent', line);
        return { text: line, end: true };
    }

    await appendTurn(current, 'agent', result.text, result.tokens);

    return { text: result.text, end: result.end };
}
