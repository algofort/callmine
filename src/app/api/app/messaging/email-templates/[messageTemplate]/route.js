import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import {
    findOwnTemplate,
    messageTemplateData,
    messageTemplateRules,
} from '@/lib/domain/message-templates';

/** PUT /app/messaging/email-templates/{messageTemplate} — ::update() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.email-templates.update' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'messaging');
    if (gated) return gated;

    const { messageTemplate: id } = await params;
    const { tpl, error } = await findOwnTemplate(id, gate.clientId);
    if (error) return error;

    const data = await validate(await readBody(request), messageTemplateRules());

    await prisma.messageTemplate.update({
        where: { id: tpl.id },
        data: { ...messageTemplateData(data), updated_at: new Date() },
    });

    return back({ success: 'Template updated.' });
});

/** DELETE /app/messaging/email-templates/{messageTemplate} — ::destroy() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.email-templates.destroy' });
    if (gate.response) return gate.response;

    const { messageTemplate: id } = await params;
    const { tpl, error } = await findOwnTemplate(id, gate.clientId);
    if (error) return error;

    await prisma.messageTemplate.delete({ where: { id: tpl.id } });
    return back({ success: 'Template deleted.' });
});
