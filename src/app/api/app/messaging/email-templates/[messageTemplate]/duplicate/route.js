import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { findOwnTemplate } from '@/lib/domain/message-templates';

/** POST /app/messaging/email-templates/{messageTemplate}/duplicate — ::duplicate() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.email-templates.duplicate' });
    if (gate.response) return gate.response;

    const { messageTemplate: id } = await params;
    const { tpl, error } = await findOwnTemplate(id, gate.clientId);
    if (error) return error;

    // $model->replicate() — everything but the key and timestamps.
    const { id: _id, created_at, updated_at, ...rest } = tpl;

    await prisma.messageTemplate.create({
        data: { ...rest, name: `${tpl.name} (copy)`, created_at: new Date(), updated_at: new Date() },
    });

    return back({ success: 'Template duplicated.' });
});
