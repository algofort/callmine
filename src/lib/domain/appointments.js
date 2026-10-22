import 'server-only';

import prisma from '@/lib/prisma';

/** Port of Client\AppointmentController's rules and ownership checks. */

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

export function appointmentRules() {
    return {
        title: ['required', 'string', 'max:255'],
        scheduled_at: ['required', 'date'],
        duration_minutes: ['nullable', 'integer', 'between:5,1440'],
        contact_id: ['nullable', 'integer'],
        contact_name: ['nullable', 'string', 'max:255'],
        contact_phone: ['nullable', 'string', 'max:32'],
        contact_email: ['nullable', 'string', 'max:255'],
        agent_id: ['nullable', 'integer'],
        status: ['nullable', `in:${APPOINTMENT_STATUSES.join(',')}`],
        notes: ['nullable', 'string', 'max:5000'],
    };
}

/** Rule::exists(...)->where('client_id', $clientId) for contact_id and agent_id. */
export async function assertAppointmentRefs(data, clientId) {
    const client_id = BigInt(clientId);
    const errors = {};

    if (data.contact_id) {
        const row = await prisma.contact.findFirst({ where: { id: BigInt(data.contact_id), client_id } });
        if (!row) errors.contact_id = ['The selected contact id is invalid.'];
    }
    if (data.agent_id) {
        const row = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id, deleted_at: null },
        });
        if (!row) errors.agent_id = ['The selected agent id is invalid.'];
    }

    return Object.keys(errors).length ? errors : null;
}

export function appointmentData(data) {
    return {
        title: data.title,
        scheduled_at: new Date(data.scheduled_at),
        duration_minutes: data.duration_minutes ?? 30,
        contact_id: data.contact_id ? BigInt(data.contact_id) : null,
        contact_name: data.contact_name ?? null,
        contact_phone: data.contact_phone ?? null,
        contact_email: data.contact_email ?? null,
        agent_id: data.agent_id ? BigInt(data.agent_id) : null,
        status: data.status ?? 'scheduled',
        notes: data.notes ?? null,
    };
}
