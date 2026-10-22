import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { assertInboundRefs, inboundRouteData, inboundRouteRules } from '@/lib/domain/inbound-routes';

/** POST /app/incoming-connections */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.incoming-connections.store' });
    if (gate.response) return gate.response;

    const body = await readBody(request);
    const data = await validate(body, inboundRouteRules(body.action));

    const refErrors = await assertInboundRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.inboundRoute.create({
        data: {
            ...inboundRouteData(data),
            client_id: BigInt(gate.clientId),
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Route created.' });
});
