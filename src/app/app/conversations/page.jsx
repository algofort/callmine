import Conversations from '@/views/client/Messaging/Conversations';
import { renderPage } from '@/lib/render';
import { requireClientPage, requirePlanFeaturePage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';
import { conversationWindowOpen } from '@/lib/services/messaging';

export const dynamic = 'force-dynamic';

/** GET /app/conversations */
export default async function Page({ searchParams }) {
    const { user, clientId } = await requireClientPage();
    await requirePlanFeaturePage(user, 'messaging');

    const params = await searchParams;
    const client_id = BigInt(clientId);

    const rows = await prisma.conversation.findMany({
        where: { client_id },
        orderBy: [{ last_message_at: 'desc' }, { id: 'desc' }],
    });

    const conversations = rows.map((c) => ({
        id: Number(c.id),
        name: c.name ?? c.wa_phone,
        wa_phone: c.wa_phone,
        last_message_at: iso(c.last_message_at),
        unread_count: c.unread_count,
        window_open: conversationWindowOpen(c),
    }));

    let thread = null;

    if (params?.conversation) {
        const active = await prisma.conversation.findFirst({
            where: { id: BigInt(params.conversation), client_id },
        });

        if (active) {
            // Opening a thread clears its unread badge.
            await prisma.conversation.update({
                where: { id: active.id },
                data: { unread_count: 0, updated_at: new Date() },
            });

            const messages = await prisma.message.findMany({
                where: { conversation_id: active.id },
                orderBy: { id: 'asc' },
            });

            thread = {
                id: Number(active.id),
                name: active.name ?? active.wa_phone,
                wa_phone: active.wa_phone,
                window_open: conversationWindowOpen(active),
                messages: messages.map((m) => ({
                    id: Number(m.id),
                    direction: m.direction,
                    type: m.type,
                    body: m.body,
                    status: m.status,
                    created_at: iso(m.created_at),
                })),
            };
        }
    }

    return renderPage(Conversations, 'client/Messaging/Conversations', { conversations, thread }, {
        url: '/app/conversations',
    });
}
