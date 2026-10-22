import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';

/** PUT /app/sip/trunks/{sipTrunk} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.sip.trunks.update' });
    if (gate.response) return gate.response;

    const { sipTrunk: id } = await params;
    const trunk = await prisma.sipTrunk.findUnique({ where: { id: BigInt(id) } });
    assertOwned(trunk, gate.clientId);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        sip_host: ['required', 'string', 'max:255'],
        sip_port: ['required', 'integer', 'between:1,65535'],
        transport: ['required', 'in:udp,tcp,tls'],
        inbound_enabled: ['nullable', 'boolean'],
        outbound_enabled: ['nullable', 'boolean'],
        concurrency_limit: ['required', 'integer', 'min:1', 'max:1000'],
        status: ['required', 'in:active,inactive'],
        password: ['nullable', 'string'],
    });

    await prisma.sipTrunk.update({
        where: { id: trunk.id },
        data: {
            name: data.name,
            sip_host: data.sip_host,
            sip_port: data.sip_port,
            transport: data.transport,
            inbound_enabled: data.inbound_enabled ?? false,
            outbound_enabled: data.outbound_enabled ?? false,
            concurrency_limit: data.concurrency_limit,
            status: data.status,
            // An empty password field leaves the stored secret untouched.
            ...(data.password ? { password: data.password } : {}),
            updated_at: new Date(),
        },
    });

    return back({ success: 'SIP trunk updated.' });
});

/** DELETE /app/sip/trunks/{sipTrunk} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.sip.trunks.destroy' });
    if (gate.response) return gate.response;

    const { sipTrunk: id } = await params;
    const trunk = await prisma.sipTrunk.findUnique({ where: { id: BigInt(id) } });
    assertOwned(trunk, gate.clientId);

    await prisma.sipTrunk.delete({ where: { id: trunk.id } });
    return back({ success: 'SIP trunk removed.' });
});
