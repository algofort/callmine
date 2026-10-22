import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { planFor } from '@/lib/plans';
import { randomKeySuffix } from '@/lib/services/client-rbac';

/** POST /app/sip/trunks */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.sip.trunks.store' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'sip');
    if (gated) return gated;

    const client_id = BigInt(gate.clientId);
    const plan = await planFor(gate.clientId);

    if ((await prisma.sipTrunk.count({ where: { client_id } })) >= Number(plan?.sip_trunks_limit ?? 0)) {
        return back({ error: 'SIP trunk limit reached for your plan.' });
    }

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        provider: ['required', 'string', 'max:32'],
        engine: ['required', 'in:elevenlabs,openai'],
        sip_host: ['required', 'string', 'max:255'],
        sip_port: ['required', 'integer', 'between:1,65535'],
        transport: ['required', 'in:udp,tcp,tls'],
        username: ['nullable', 'string'],
        password: ['nullable', 'string'],
        auth_id: ['nullable', 'string'],
        inbound_enabled: ['nullable', 'boolean'],
        outbound_enabled: ['nullable', 'boolean'],
        concurrency_limit: ['required', 'integer', 'min:1', 'max:1000'],
    });

    await prisma.sipTrunk.create({
        data: {
            client_id,
            name: data.name,
            provider: data.provider,
            engine: data.engine,
            sip_host: data.sip_host,
            sip_port: data.sip_port,
            transport: data.transport,
            username: data.username ?? null,
            password: data.password ?? null,
            auth_id: data.auth_id ?? null,
            inbound_enabled: data.inbound_enabled ?? false,
            outbound_enabled: data.outbound_enabled ?? false,
            concurrency_limit: data.concurrency_limit,
            webhook_secret: `sip_${randomKeySuffix(40)}`,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'SIP trunk added.' });
});
