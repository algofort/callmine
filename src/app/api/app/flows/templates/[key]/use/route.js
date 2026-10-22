import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, redirectTo } from '@/lib/http';
import { findFlowTemplate } from '@/lib/services/flows';

/** POST /app/flows/templates/{key}/use */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.flows.templates.use' });
    if (gate.response) return gate.response;

    const { key } = await params;
    const tpl = findFlowTemplate(key);
    if (!tpl) return abort(404);

    const flow = await prisma.flow.create({
        data: {
            client_id: BigInt(gate.clientId),
            user_id: gate.user.id,
            name: tpl.name,
            description: tpl.description,
            status: 'draft',
            trigger_type: tpl.trigger_type,
            definition: tpl.definition,
            template_key: tpl.key,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo(`/app/flows/${Number(flow.id)}/edit`, { success: 'Flow created from template.' });
});
