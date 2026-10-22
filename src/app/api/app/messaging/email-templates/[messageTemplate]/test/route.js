import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { findOwnTemplate } from '@/lib/domain/message-templates';
import { sendEmailMessage } from '@/lib/services/messaging';

/** POST /app/messaging/email-templates/{messageTemplate}/test — ::test() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.messaging.email-templates.test' });
    if (gate.response) return gate.response;

    const { messageTemplate: id } = await params;
    const { tpl, error } = await findOwnTemplate(id, gate.clientId);
    if (error) return error;

    const data = await validate(await readBody(request), { email: ['required', 'email'] });

    // Placeholder each declared variable so the preview shows its position.
    const vars = {};
    for (const v of tpl.variables ?? []) {
        const key = v?.key ?? v;
        vars[key] = `[${v?.label ?? key}]`;
    }

    await sendEmailMessage(
        gate.clientId,
        data.email,
        tpl.subject ?? tpl.name,
        tpl.html ?? '',
        vars,
        { template_id: tpl.id, sent_by: 'test' },
    );

    return back({ success: `Test email sent to ${data.email}.` });
});
