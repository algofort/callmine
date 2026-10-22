import IncomingConnectionsIndex from '@/views/client/IncomingConnections/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/incoming-connections */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const client_id = BigInt(clientId);

    const routes = await prisma.inboundRoute.findMany({
        where: { client_id },
        include: {
            phone_numbers: { select: { id: true, e164_number: true } },
            agents: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    });

    const connected = await prisma.inboundRoute.findMany({
        where: { client_id, agent_id: { not: null } },
        distinct: ['agent_id'],
        select: { agent_id: true },
    });

    const [total, active, inboundNumbers, numbers, agents] = await Promise.all([
        prisma.inboundRoute.count({ where: { client_id } }),
        prisma.inboundRoute.count({ where: { client_id, enabled: true } }),
        prisma.phoneNumber.count({ where: { client_id, direction: { in: ['inbound', 'both'] } } }),
        prisma.phoneNumber.findMany({ where: { client_id }, select: { id: true, e164_number: true } }),
        prisma.agent.findMany({
            where: { client_id, status: 'active', deleted_at: null },
            select: { id: true, name: true },
        }),
    ]);

    const props = {
        routes: routes.map((r) => ({
            id: Number(r.id),
            name: r.name,
            action: r.action,
            forward_to: r.forward_to,
            priority: r.priority,
            enabled: r.enabled,
            phone_number_id: r.phone_number_id ? Number(r.phone_number_id) : null,
            agent_id: r.agent_id ? Number(r.agent_id) : null,
            e164_number: r.phone_numbers?.e164_number ?? null,
            agent_name: r.agents?.name ?? null,
        })),
        stats: [
            { label: 'Total routes', value: String(total), icon: 'network', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'activity', accent: 'signal' },
            { label: 'Inbound numbers', value: String(inboundNumbers), icon: 'phone', accent: 'cold' },
            { label: 'Connected agents', value: String(connected.length), icon: 'bot', accent: 'warm' },
        ],
        numbers: plain(numbers),
        agents: plain(agents),
    };

    return renderPage(IncomingConnectionsIndex, 'client/IncomingConnections/Index', props, {
        url: '/app/incoming-connections',
    });
}
