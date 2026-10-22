import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { activeSmtp, sendRaw } from '@/lib/services/mail';

/**
 * Port of App\Services\Messaging — EmailSender, WhatsAppSender and the
 * WhatsApp provider registry (Meta Cloud + WhatsWay).
 */

export const MESSAGE_STATUS = {
    QUEUED: 'queued',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
};

function render(text, vars) {
    let out = String(text ?? '');
    for (const [key, value] of Object.entries(vars ?? {})) {
        out = out.replaceAll(`{{${key}}}`, String(value ?? ''));
    }
    return out;
}

/* --------------------------------------------------------- EmailSender */

/** — always writes a `messages` row, sent or failed. */
export async function sendEmailMessage(clientId, to, subject, html, vars = {}, opts = {}) {
    const renderedSubject = render(subject, vars);
    const renderedHtml = render(html, vars);

    const message = await prisma.message.create({
        data: {
            client_id: BigInt(clientId),
            contact_id: opts.contact_id ? BigInt(opts.contact_id) : null,
            channel: 'email',
            direction: 'out',
            type: 'text',
            subject: renderedSubject,
            body: renderedHtml,
            template_id: opts.template_id ? BigInt(opts.template_id) : null,
            provider: 'smtp',
            status: MESSAGE_STATUS.QUEUED,
            call_id: opts.call_id ? BigInt(opts.call_id) : null,
            sent_by: opts.sent_by ?? 'user',
            meta: { to },
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    const smtp = await activeSmtp();
    if (!smtp) {
        return prisma.message.update({
            where: { id: message.id },
            data: {
                status: MESSAGE_STATUS.FAILED,
                error: 'No active SMTP configuration.',
                updated_at: new Date(),
            },
        });
    }

    try {
        await sendRaw(smtp, to, renderedSubject, renderedHtml);
        return prisma.message.update({
            where: { id: message.id },
            data: { status: MESSAGE_STATUS.SENT, updated_at: new Date() },
        });
    } catch (e) {
        console.warn('Email message send failed:', e?.message);
        return prisma.message.update({
            where: { id: message.id },
            data: { status: MESSAGE_STATUS.FAILED, error: e?.message, updated_at: new Date() },
        });
    }
}

/* ------------------------------------------------- WhatsApp providers */

export async function messagingSettings() {
    const row = await prisma.messagingSetting.findFirst().catch(() => null);
    if (row) return row;

    return prisma.messagingSetting
        .create({
            data: {
                provider_mode: config.messaging.provider_mode,
                verify_token: config.messaging.meta.verify_token,
                created_at: new Date(),
                updated_at: new Date(),
            },
        })
        .catch(() => ({ provider_mode: config.messaging.provider_mode }));
}

function modeAllows(mode, provider) {
    return mode === 'both' || mode === provider;
}

export async function enabledWhatsAppProviders() {
    const settings = await messagingSettings();
    const mode = settings.provider_mode ?? 'disabled';

    const out = [];
    if (modeAllows(mode, 'meta')) out.push({ key: 'meta', name: 'Meta Cloud API' });
    if (modeAllows(mode, 'whatsway')) out.push({ key: 'whatsway', name: 'WhatsWay' });
    return out;
}

/** — null when the mode disables it. */
export async function providerForAccount(account) {
    const settings = await messagingSettings();
    const mode = settings.provider_mode ?? 'disabled';
    if (!modeAllows(mode, account.provider)) return null;

    return account.provider === 'meta' ? metaProvider() : whatsWayProvider();
}

/** MetaCloudProvider */
function metaProvider() {
    const version = config.messaging.meta.graph_version;

    async function post(account, body) {
        const phoneId = account.phone_number_id;
        const token = account.access_token;
        if (!phoneId || !token) return { ok: false, error: 'Missing Meta credentials.' };

        try {
            const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
                signal: AbortSignal.timeout(20000),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
            return { ok: true, id: json?.messages?.[0]?.id ?? null };
        } catch (e) {
            return { ok: false, error: e?.message };
        }
    }

    return {
        key: () => 'meta',
        name: () => 'Meta Cloud API',
        sendText: (account, to, text) => post(account, { to, type: 'text', text: { body: text } }),
        sendTemplate: (account, to, template, language, params = []) =>
            post(account, {
                to,
                type: 'template',
                template: {
                    name: template,
                    language: { code: language },
                    ...(params.length
                        ? {
                              components: [
                                  {
                                      type: 'body',
                                      parameters: params.map((p) => ({ type: 'text', text: String(p) })),
                                  },
                              ],
                          }
                        : {}),
                },
            }),
    };
}

/** WhatsWayProvider */
function whatsWayProvider() {
    const baseUrl = config.messaging.whatsway.base_url;

    async function post(account, path, body) {
        const base = account.base_url || baseUrl;
        const apiKey = account.api_key || config.messaging.whatsway.api_key;
        if (!base || !apiKey) return { ok: false, error: 'Missing WhatsWay credentials.' };

        try {
            const res = await fetch(`${String(base).replace(/\/+$/, '')}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(20000),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return { ok: false, error: json?.message ?? `HTTP ${res.status}` };
            return { ok: true, id: json?.id ?? json?.message_id ?? null };
        } catch (e) {
            return { ok: false, error: e?.message };
        }
    }

    return {
        key: () => 'whatsway',
        name: () => 'WhatsWay',
        sendText: (account, to, text) =>
            post(account, '/api/send', { phone: to, message: text, type: 'text' }),
        sendTemplate: (account, to, template, language, params = []) =>
            post(account, '/api/send-template', { phone: to, template, language, params }),
    };
}

/* ------------------------------------------------------ WhatsAppSender */

/** — firstOrCreate on (client, channel, phone). */
export async function findOrCreateConversation(clientId, account, waPhone) {
    const where = { client_id: BigInt(clientId), channel: 'whatsapp', wa_phone: waPhone };
    const existing = await prisma.conversation.findFirst({ where });
    if (existing) return existing;

    return prisma.conversation.create({
        data: {
            ...where,
            whatsapp_account_id: account?.id ?? null,
            status: 'open',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

async function dispatchWhatsApp(account, to, send, attrs) {
    const conversation = await findOrCreateConversation(account.client_id, account, to);

    const message = await prisma.message.create({
        data: {
            client_id: account.client_id,
            conversation_id: conversation.id,
            contact_id: conversation.contact_id ?? (attrs.contact_id ? BigInt(attrs.contact_id) : null),
            channel: 'whatsapp',
            direction: 'out',
            type: attrs.type,
            body: attrs.body,
            provider: account.provider,
            status: MESSAGE_STATUS.QUEUED,
            call_id: attrs.call_id ? BigInt(attrs.call_id) : null,
            sent_by: attrs.sent_by ?? 'user',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    const provider = await providerForAccount(account);
    if (!provider) {
        return prisma.message.update({
            where: { id: message.id },
            data: {
                status: MESSAGE_STATUS.FAILED,
                error: 'WhatsApp provider disabled for this account.',
                updated_at: new Date(),
            },
        });
    }

    const result = await send(provider);

    if (result?.ok) {
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { last_message_at: new Date(), updated_at: new Date() },
        });
        return prisma.message.update({
            where: { id: message.id },
            data: {
                status: MESSAGE_STATUS.SENT,
                provider_message_id: result.id ?? null,
                updated_at: new Date(),
            },
        });
    }

    return prisma.message.update({
        where: { id: message.id },
        data: {
            status: MESSAGE_STATUS.FAILED,
            error: result?.error ?? 'send_failed',
            updated_at: new Date(),
        },
    });
}

export async function sendWhatsAppText(account, to, text, opts = {}) {
    return dispatchWhatsApp(account, to, (p) => p.sendText(account, to, text), {
        type: 'text',
        body: text,
        ...opts,
    });
}

export async function sendWhatsAppTemplate(account, to, template, language, params = [], opts = {}) {
    return dispatchWhatsApp(
        account,
        to,
        (p) => p.sendTemplate(account, to, template, language, params),
        { type: 'template', body: template, ...opts },
    );
}

/** — WhatsApp's free-form reply window. */
export function conversationWindowOpen(conversation) {
    if (!conversation?.window_expires_at) return false;
    return new Date(conversation.window_expires_at).getTime() > Date.now();
}
