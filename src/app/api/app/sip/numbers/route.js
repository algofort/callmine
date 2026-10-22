import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { planFor } from '@/lib/plans';
import { toE164 } from '@/lib/domain/contacts';
import { sipEngineForTrunk } from '@/lib/services/sip';

/** POST /app/sip/numbers */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.sip.numbers.import' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'sip');
    if (gated) return gated;

    const client_id = BigInt(gate.clientId);

    const data = await validate(await readBody(request), {
        sip_trunk_id: ['required', 'integer'],
        phone: ['required', 'string', 'max:32'],
        direction: ['required', 'in:inbound,outbound,both'],
        agent_id: ['nullable', 'integer'],
    });

    const trunk = await prisma.sipTrunk.findFirst({
        where: { id: BigInt(data.sip_trunk_id), client_id },
    });
    if (!trunk) return validationError({ sip_trunk_id: ['The selected trunk is invalid.'] });

    if (data.agent_id) {
        const agent = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id, deleted_at: null },
        });
        if (!agent) return validationError({ agent_id: ['The selected agent id is invalid.'] });
    }

    const plan = await planFor(gate.clientId);
    const used = await prisma.phoneNumber.count({ where: { client_id, source: 'sip' } });
    if (used >= Number(plan?.sip_numbers_limit ?? 0)) {
        return back({ error: 'SIP number limit reached for your plan.' });
    }

    const e164 = toE164(data.phone);
    if (!e164) return back({ error: 'Invalid phone number.' });

    const number = await prisma.phoneNumber.create({
        data: {
            client_id,
            e164_number: e164,
            friendly_name: e164,
            type: 'international',
            source: 'sip',
            sip_trunk_id: trunk.id,
            agent_id: data.agent_id ? BigInt(data.agent_id) : null,
            direction: data.direction,
            monthly_cost_credits: 0,
            purchased_at: new Date(),
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    const engine = sipEngineForTrunk(trunk);
    const result = (await engine?.provisionNumber(trunk, number)) ?? { ok: false, error: 'Unknown engine.' };

    if (!result.ok) {
        // Provisioning failed — do not leave an unusable number behind.
        await prisma.phoneNumber.delete({ where: { id: number.id } });
        return back({ error: result.error ?? 'Provisioning failed.' });
    }

    return back({ success: 'Number imported.' });
});
