import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { assertInboundRefs, inboundRouteData, inboundRouteRules } from '@/lib/domain/inbound-routes';

/** PUT /app/incoming-connections/{inboundRoute} — ::update() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.incoming-connections.update' });
    if (gate.response) return gate.response;

    const { inboundRoute: id } = await params;
    const route = await prisma.inboundRoute.findUnique({ where: { id: BigInt(id) } });
    assertOwned(route, gate.clientId);

    const body = await readBody(request);
    const data = await validate(body, inboundRouteRules(body.action));

    const refErrors = await assertInboundRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.inboundRoute.update({
        where: { id: route.id },
        data: { ...inboundRouteData(data), updated_at: new Date() },
    });

    return back({ success: 'Route updated.' });
});

/** DELETE /app/incoming-connections/{inboundRoute} — ::destroy() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.incoming-connections.destroy' });
    if (gate.response) return gate.response;

    const { inboundRoute: id } = await params;
    const route = await prisma.inboundRoute.findUnique({ where: { id: BigInt(id) } });
    assertOwned(route, gate.clientId);

    await prisma.inboundRoute.delete({ where: { id: route.id } });
    return back({ success: 'Route deleted.' });
});
