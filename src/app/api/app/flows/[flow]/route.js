import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, redirectTo, validate } from '@/lib/http';
import { flowRules } from '@/lib/domain/flows';

/** PUT /app/flows/{flow} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.flows.update' });
    if (gate.response) return gate.response;

    const { flow: id } = await params;
    const flow = await prisma.flow.findUnique({ where: { id: BigInt(id) } });
    assertOwned(flow, gate.clientId);

    const data = await validate(await readBody(request), flowRules());

    await prisma.flow.update({
        where: { id: flow.id },
        data: {
            name: data.name,
            description: data.description ?? null,
            status: data.status,
            trigger_type: data.trigger_type ?? flow.trigger_type,
            definition: data.definition ?? flow.definition,
            updated_at: new Date(),
        },
    });

    return back({ success: 'Flow saved.' });
});

/** DELETE /app/flows/{flow} (soft delete). */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.flows.destroy' });
    if (gate.response) return gate.response;

    const { flow: id } = await params;
    const flow = await prisma.flow.findUnique({ where: { id: BigInt(id) } });
    assertOwned(flow, gate.clientId);

    await prisma.flow.update({
        where: { id: flow.id },
        data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return redirectTo('/app/flows', { success: 'Flow deleted.' });
});
