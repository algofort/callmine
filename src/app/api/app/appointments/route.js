import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { appointmentData, appointmentRules, assertAppointmentRefs } from '@/lib/domain/appointments';

/** POST /app/appointments */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.appointments.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), appointmentRules());

    const refErrors = await assertAppointmentRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.appointment.create({
        data: {
            ...appointmentData(data),
            client_id: BigInt(gate.clientId),
            source: 'manual',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Appointment created.' });
});
