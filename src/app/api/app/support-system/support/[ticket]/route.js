import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';

/** PATCH /app/support-system/support/{ticket} — ::updateSupportTicket() */
export const PATCH = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.support-system.support.update' });
    if (gate.response) return gate.response;

    const { ticket: id } = await params;
    const ticket = await prisma.customerSupportTicket.findUnique({ where: { id: BigInt(id) } });
    assertOwned(ticket, gate.clientId);

    const data = await validate(await readBody(request), {
        status: ['nullable', 'string', 'max:32'],
        priority: ['nullable', 'string', 'max:32'],
    });

    await prisma.customerSupportTicket.update({
        where: { id: ticket.id },
        data: {
            status: data.status ?? ticket.status,
            priority: data.priority ?? ticket.priority,
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/support-system/support');
});
