import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { flowRules } from '@/lib/domain/flows';
import { findFlowTemplate } from '@/lib/services/flows';

/** POST /app/flows */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.flows.store' });
    if (gate.response) return gate.response;

    const body = await readBody(request);
    const data = await validate(body, flowRules());

    // A template_key seeds the canvas and trigger when the payload omits them.
    let definition = data.definition ?? { nodes: [], edges: [] };
    let trigger_type = data.trigger_type || 'manual';
    let template_key = null;

    if (body.template_key) {
        const tpl = findFlowTemplate(String(body.template_key));
        if (tpl) {
            definition = data.definition ?? tpl.definition;
            trigger_type = data.trigger_type || tpl.trigger_type;
            template_key = tpl.key;
        }
    }

    const flow = await prisma.flow.create({
        data: {
            client_id: BigInt(gate.clientId),
            user_id: gate.user.id,
            name: data.name,
            description: data.description ?? null,
            status: data.status,
            trigger_type,
            definition,
            template_key,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo(`/app/flows/${Number(flow.id)}/edit`, { success: 'Flow created.' });
});
