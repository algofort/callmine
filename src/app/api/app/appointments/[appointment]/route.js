import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { appointmentData, appointmentRules, assertAppointmentRefs } from '@/lib/domain/appointments';

/** PUT /app/appointments/{appointment} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.appointments.update' });
    if (gate.response) return gate.response;

    const { appointment: id } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id: BigInt(id) } });
    assertOwned(appointment, gate.clientId);

    const data = await validate(await readBody(request), appointmentRules());

    const refErrors = await assertAppointmentRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.appointment.update({
        where: { id: appointment.id },
        data: { ...appointmentData(data), updated_at: new Date() },
    });

    return back({ success: 'Appointment updated.' });
});

/** DELETE /app/appointments/{appointment} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.appointments.destroy' });
    if (gate.response) return gate.response;

    const { appointment: id } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id: BigInt(id) } });
    assertOwned(appointment, gate.clientId);

    await prisma.appointment.delete({ where: { id: appointment.id } });
    return back({ success: 'Appointment deleted.' });
});
