import { notFound } from 'next/navigation';
import SupportTickets from '@/views/client/SupportSystem/SupportTickets';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { dateString } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/support-system/support */
export default async function Page() {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const rows = await prisma.customerSupportTicket.findMany({
        where: { client_id: BigInt(clientId) },
        include: { customer_support_ticket_messages: { orderBy: { created_at: 'asc' } } },
        orderBy: { id: 'desc' },
    });

    const tickets = rows.map((ticket) => ({
        id: String(ticket.id),
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        creatorName: ticket.requester_name || 'Customer',
        createdAt: dateString(ticket.created_at),
        description: ticket.description,
        assignee: null,
        messages: ticket.customer_support_ticket_messages.map((m) => ({
            role: m.sender_type === 'client' ? (m.is_internal ? 'internal' : 'agent') : 'user',
            text: m.message,
            at: m.created_at ? new Date(m.created_at).toISOString() : null,
        })),
    }));

    return renderPage(SupportTickets, 'client/SupportSystem/SupportTickets', { tickets }, {
        url: '/app/support-system/support',
    });
}
