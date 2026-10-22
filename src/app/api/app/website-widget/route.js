import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { WIDGET_POSITIONS, firstOrCreateWidget } from '@/lib/domain/widget';

/** PUT /app/website-widget */
export const PUT = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.website-widget.update' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        title: ['required', 'string', 'max:255'],
        welcome_message: ['nullable', 'string', 'max:1000'],
        primary_color: ['required', 'string', 'regex:/^#([0-9a-fA-F]{6})$/'],
        position: ['required', `in:${WIDGET_POSITIONS.join(',')}`],
        enabled: ['nullable', 'boolean'],
        agent_id: ['nullable', 'integer'],
    });

    if (data.agent_id) {
        const agent = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id: BigInt(gate.clientId), deleted_at: null },
        });
        if (!agent) return validationError({ agent_id: ['The selected agent id is invalid.'] });
    }

    const widget = await firstOrCreateWidget(gate.clientId);

    await prisma.websiteWidget.update({
        where: { id: widget.id },
        data: {
            title: data.title,
            welcome_message: data.welcome_message ?? null,
            primary_color: data.primary_color,
            position: data.position,
            enabled: data.enabled ?? false,
            agent_id: data.agent_id ? BigInt(data.agent_id) : null,
            updated_at: new Date(),
        },
    });

    return back({ success: 'Widget settings saved.' });
});
