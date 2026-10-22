import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { defaultAiProvider } from '@/lib/services/ai';

/** Port of App\Services\Calling\AgentConversationService. */

function fillVars(text, contact) {
    return String(text)
        .replaceAll('{{name}}', contact?.name ?? 'there')
        .replaceAll('{{company}}', contact?.company ?? '');
}

export function greeting(agent, contact = null) {
    const configured = String(agent?.greeting ?? '').trim();
    if (configured !== '') return fillVars(configured, contact);

    return 'Hi, this is your AI assistant calling. Do you have a quick moment to chat?';
}

/** The full system prompt: persona, objective, knowledge base and call policy. */
export async function systemPrompt(agent, campaign = null, contact = null) {
    const parts = [];

    parts.push(String(agent?.system_prompt ?? '').trim() || 'You are a helpful AI phone agent.');

    if (agent?.tone || agent?.personality) {
        parts.push(`Speak in a ${`${agent.tone ?? ''} ${agent.personality ?? ''}`.trim()} manner.`);
    }
    if (campaign?.goal) parts.push(`Call objective: ${campaign.goal}`);

    const kb = await prisma.knowledgeBaseItem.findMany({
        where: { agent_id: agent.id, status: 'ready', content: { not: null } },
        orderBy: { id: 'asc' },
        take: 5,
        select: { content: true },
    });

    const contents = kb.map((k) => k.content).filter(Boolean);
    if (contents.length) {
        parts.push(`Use this knowledge to answer accurately:\n${contents.join('\n---\n').slice(0, 4000)}`);
    }

    if (contact?.name) parts.push(`You are speaking with ${contact.name}.`);

    parts.push(
        'Keep replies short and conversational (1-2 sentences), suitable for a phone call. ' +
            'Ask one question at a time and wait for the answer.',
    );
    parts.push(
        'You are qualifying this lead. A bare "yes" or expression of interest is NOT the end of ' +
            'the call — follow up to learn what matters: their specific need, timeline, budget or team size, ' +
            'and who makes the decision. Acknowledge what they say, then ask the next relevant question. ' +
            'Before ending, confirm a concrete next step (a callback time, a demo, or an email to send) and ' +
            'read back the details you captured.',
    );
    parts.push(
        'Only end the call when the objective is met, the caller declines or asks to stop, or they ' +
            'clearly want to go. To end, finish your reply with the token [END_CALL].',
    );

    return parts.join('\n\n');
}

/** One in-call turn. Never throws — a failure degrades to a re-ask. */
export async function reply(agent, campaign, contact, history, userUtterance) {
    const provider = await defaultAiProvider();

    if (!provider) {
        console.warn(
            'AI provider not configured — agent conversation degraded to a canned goodbye. ' +
                'Add an OpenAI key under Admin → Engines → OpenAI (or set OPENAI_API_KEY).',
            { agent_id: String(agent.id), campaign_id: campaign ? String(campaign.id) : null },
        );
        return { text: 'Thank you, I appreciate your time. Goodbye.', tokens: 0, end: true };
    }

    let prompt = `${await systemPrompt(agent, campaign, contact)}\n\n`;
    for (const turn of history ?? []) {
        prompt += `${turn.role === 'agent' ? 'Agent: ' : 'Caller: '}${turn.text}\n`;
    }
    prompt += `Caller: ${userUtterance}\nAgent:`;

    let result;
    try {
        result = await provider.complete(prompt, {
            temperature: Number(agent.temperature),
            max_tokens: 200,
            timeout: config.calling.reply_timeout,
        });
    } catch (e) {
        console.warn('In-call LLM reply failed:', e?.message, {
            agent_id: String(agent.id),
            campaign_id: campaign ? String(campaign.id) : null,
        });
        return {
            text: "Sorry, I didn't quite catch that — could you say that again?",
            tokens: 0,
            end: false,
            error: e?.message,
        };
    }

    let text = String(result.text ?? '').trim();
    let end = text.includes('[END_CALL]');
    text = text.replaceAll('[END_CALL]', '').trim();

    if (text === '') {
        text = 'Thanks for your time. Goodbye.';
        end = true;
    }

    return { text, tokens: Number(result.tokens_used ?? 0), end };
}
