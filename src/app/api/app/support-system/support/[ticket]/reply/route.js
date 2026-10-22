import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';

/** POST /app/support-system/support/{ticket}/reply — ::addSupportReply() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.support-system.support.reply' });
    if (gate.response) return gate.response;

    const { ticket: id } = await params;
    const ticket = await prisma.customerSupportTicket.findUnique({ where: { id: BigInt(id) } });
    assertOwned(ticket, gate.clientId);

    const data = await validate(await readBody(request), {
        message: ['required', 'string', 'max:5000'],
        internal_note: ['nullable', 'boolean'],
    });

    await prisma.customerSupportTicketMessage.create({
        data: {
            ticket_id: ticket.id,
            sender_type: 'client',
            sender_name: gate.user.name,
            message: data.message,
            is_internal: !!data.internal_note,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // A reply moves an untouched ticket into progress.
    if (ticket.status === 'open') {
        await prisma.customerSupportTicket.update({
            where: { id: ticket.id },
            data: { status: 'in_progress', updated_at: new Date() },
        });
    }

    return redirectTo('/app/support-system/support');
});
