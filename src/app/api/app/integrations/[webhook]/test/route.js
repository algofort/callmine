import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { WEBHOOK_EVENTS, deliverWebhook } from '@/lib/services/webhook-dispatcher';

/** POST /app/integrations/{webhook}/test */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.integrations.test' });
    if (gate.response) return gate.response;

    const { webhook: id } = await params;
    const webhook = await prisma.webhook.findUnique({ where: { id: BigInt(id) } });
    assertOwned(webhook, gate.clientId);

    // Fire and forget — the caller must not wait on the remote endpoint.
    deliverWebhook(webhook.id, WEBHOOK_EVENTS.CALL_COMPLETED, {
        test: true,
        call_id: 0,
        message: 'This is a test event from CallMineAI.',
    }).catch((e) => console.error('[webhook] test delivery failed:', e?.message));

    return back({ success: 'Test event sent.' });
});
