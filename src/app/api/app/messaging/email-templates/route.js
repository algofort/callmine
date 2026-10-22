import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { messageTemplateData, messageTemplateRules } from '@/lib/domain/message-templates';

/** POST /app/messaging/email-templates */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.messaging.email-templates.store' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'messaging');
    if (gated) return gated;

    const data = await validate(await readBody(request), messageTemplateRules());

    await prisma.messageTemplate.create({
        data: {
            ...messageTemplateData(data),
            client_id: BigInt(gate.clientId),
            channel: 'email',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Template saved.' });
});
