import 'server-only';

import prisma from '@/lib/prisma';
import { toE164 } from '@/lib/domain/contacts';
import { MESSAGE_STATUS } from '@/lib/services/messaging';

/** Port of App\Services\Messaging\InboundWhatsAppProcessor. */

export async function processInboundWhatsApp(payload) {
    for (const entry of payload?.entry ?? []) {
        for (const change of entry?.changes ?? []) {
            const value = change?.value ?? {};

            const phoneNumberId = value?.metadata?.phone_number_id;
            const account = phoneNumberId
                ? await prisma.whatsAppAccount.findFirst({ where: { phone_number_id: phoneNumberId } })
                : null;

            if (!account) continue;

            for (const msg of value?.messages ?? []) await ingestMessage(account, msg, value);
            for (const status of value?.statuses ?? []) await applyStatus(status);
        }
    }
}

async function ingestMessage(account, msg, value) {
    const from = toE164(msg?.from ?? '') ?? msg?.from ?? null;
    if (!from) return;

    const name = value?.contacts?.[0]?.profile?.name ?? null;
    const client_id = account.client_id;

    let contact = await prisma.contact.findFirst({ where: { client_id, phone: from } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                client_id,
                phone: from,
                name,
                source: 'api',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    let conversation = await prisma.conversation.findFirst({
        where: { client_id, channel: 'whatsapp', wa_phone: from },
    });
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                client_id,
                channel: 'whatsapp',
                wa_phone: from,
                whatsapp_account_id: account.id,
                contact_id: contact.id,
                name,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    const type = msg?.type ?? 'text';
    const body =
        msg?.text?.body ??
        msg?.button?.text ??
        msg?.interactive?.button_reply?.title ??
        type.charAt(0).toUpperCase() + type.slice(1);

    await prisma.message.create({
        data: {
            client_id,
            conversation_id: conversation.id,
            contact_id: contact.id,
            channel: 'whatsapp',
            direction: 'in',
            type,
            body,
            provider: 'meta',
            provider_message_id: msg?.id ?? null,
            status: MESSAGE_STATUS.DELIVERED,
            meta: msg,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
            last_message_at: new Date(),
            // WhatsApp's 24h customer-care window.
            window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            unread_count: Number(conversation.unread_count ?? 0) + 1,
            updated_at: new Date(),
        },
    });
}

async function applyStatus(status) {
    const id = status?.id;
    const state = status?.status; // sent, delivered, read, failed
    if (!id || !state) return;

    await prisma.message.updateMany({
        where: { provider_message_id: id },
        data: {
            status: ['sent', 'delivered', 'read', 'failed'].includes(state)
                ? state
                : MESSAGE_STATUS.SENT,
            updated_at: new Date(),
        },
    });
}
