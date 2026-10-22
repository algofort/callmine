import 'server-only';

import prisma from '@/lib/prisma';

/** Port of Client\IncomingConnectionController's rules. */

export const INBOUND_ACTIONS = ['connect_agent', 'voicemail', 'forward'];

export function inboundRouteRules(action) {
    return {
        name: ['required', 'string', 'max:255'],
        phone_number_id: ['nullable', 'integer'],
        agent_id: ['nullable', 'integer'],
        action: ['required', `in:${INBOUND_ACTIONS.join(',')}`],
        // required_if:action,forward
        forward_to: action === 'forward' ? ['required', 'string', 'max:255'] : ['nullable', 'string', 'max:255'],
        priority: ['nullable', 'integer', 'min:0'],
        enabled: ['nullable', 'boolean'],
    };
}

export async function assertInboundRefs(data, clientId) {
    const client_id = BigInt(clientId);
    const errors = {};

    if (data.phone_number_id) {
        const row = await prisma.phoneNumber.findFirst({
            where: { id: BigInt(data.phone_number_id), client_id },
        });
        if (!row) errors.phone_number_id = ['The selected phone number id is invalid.'];
    }
    if (data.agent_id) {
        const row = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id, deleted_at: null },
        });
        if (!row) errors.agent_id = ['The selected agent id is invalid.'];
    }

    return Object.keys(errors).length ? errors : null;
}

export function inboundRouteData(data) {
    return {
        name: data.name,
        phone_number_id: data.phone_number_id ? BigInt(data.phone_number_id) : null,
        agent_id: data.agent_id ? BigInt(data.agent_id) : null,
        action: data.action,
        forward_to: data.forward_to ?? null,
        priority: data.priority ?? 0,
        enabled: data.enabled ?? true,
    };
}
