import AppointmentsIndex from '@/views/client/Appointments/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/appointments */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    if (params?.status) where.status = String(params.status);
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ title: { contains: s } }, { contact_name: { contains: s } }];
    }

    const appointments = await paginate(prisma.appointment, {
        where,
        orderBy: { scheduled_at: 'desc' },
        include: {
            contacts: { select: { id: true, name: true, phone: true } },
            agents: { select: { id: true, name: true } },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/appointments',
        query: { search: params?.search, status: params?.status },
        transform: (a) => ({
            id: Number(a.id),
            title: a.title,
            contact_name: a.contacts?.name ?? a.contact_name,
            contact_phone: a.contacts?.phone ?? a.contact_phone,
            agent_name: a.agents?.name ?? null,
            scheduled_at: iso(a.scheduled_at),
            duration_minutes: a.duration_minutes,
            status: a.status,
            source: a.source,
            notes: a.notes,
        }),
    });

    const [total, upcoming, completed, cancelled, agents, contacts] = await Promise.all([
        prisma.appointment.count({ where: { client_id } }),
        prisma.appointment.count({
            where: { client_id, status: 'scheduled', scheduled_at: { gte: new Date() } },
        }),
        prisma.appointment.count({ where: { client_id, status: 'completed' } }),
        prisma.appointment.count({ where: { client_id, status: { in: ['cancelled', 'no_show'] } } }),
        prisma.agent.findMany({
            where: { client_id, status: 'active', deleted_at: null },
            select: { id: true, name: true },
        }),
        prisma.contact.findMany({
            where: { client_id },
            orderBy: { id: 'desc' },
            take: 200,
            select: { id: true, name: true, phone: true },
        }),
    ]);

    const props = {
        appointments,
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.status ? { status: String(params.status) } : {}),
        },
        stats: [
            { label: 'Total', value: String(total), icon: 'list', accent: 'brand' },
            { label: 'Upcoming', value: String(upcoming), icon: 'clock', accent: 'signal' },
            { label: 'Completed', value: String(completed), icon: 'check', accent: 'cold' },
            { label: 'Cancelled', value: String(cancelled), icon: 'shield', accent: 'warm' },
        ],
        agents: plain(agents),
        contacts: plain(contacts),
    };

    return renderPage(AppointmentsIndex, 'client/Appointments/Index', props, {
        url: '/app/appointments',
    });
}
