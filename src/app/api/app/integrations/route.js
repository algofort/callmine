import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { assertWebhookRefs, webhookData, webhookRules } from '@/lib/domain/webhooks';
import { randomToken } from '@/lib/domain/widget';

/** POST /app/integrations */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.integrations.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), webhookRules());

    const refErrors = await assertWebhookRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.webhook.create({
        data: {
            ...webhookData(data),
            client_id: BigInt(gate.clientId),
            secret: `whsec_${randomToken(40)}`,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Webhook created.' });
});
