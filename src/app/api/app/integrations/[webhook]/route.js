import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { assertWebhookRefs, webhookData, webhookRules } from '@/lib/domain/webhooks';

/** PUT /app/integrations/{webhook} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.integrations.update' });
    if (gate.response) return gate.response;

    const { webhook: id } = await params;
    const webhook = await prisma.webhook.findUnique({ where: { id: BigInt(id) } });
    assertOwned(webhook, gate.clientId);

    const data = await validate(await readBody(request), webhookRules());

    const refErrors = await assertWebhookRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.webhook.update({
        where: { id: webhook.id },
        data: { ...webhookData(data), updated_at: new Date() },
    });

    return back({ success: 'Webhook updated.' });
});

/** DELETE /app/integrations/{webhook} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.integrations.destroy' });
    if (gate.response) return gate.response;

    const { webhook: id } = await params;
    const webhook = await prisma.webhook.findUnique({ where: { id: BigInt(id) } });
    assertOwned(webhook, gate.clientId);

    await prisma.webhook.delete({ where: { id: webhook.id } });
    return back({ success: 'Webhook deleted.' });
});
