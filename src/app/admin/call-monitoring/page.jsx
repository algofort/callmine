import AdminCallMonitor from '@/views/Admin/CallMonitor/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const LIVE = ['ringing', 'in_progress', 'queued'];

/** Last four digits hidden, unlike the client-side mask. */
function mask(phone) {
    if (!phone) return '—';
    return phone.length > 4 ? `${phone.slice(0, -4)}••••` : phone;
}

/** GET /admin/call-monitoring */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_settings');
    const params = await searchParams;

    const where = {};
    if (params?.status) where.status = String(params.status);
    if (params?.client) where.client_id = BigInt(params.client);

    const calls = await paginate(prisma.call, {
        where,
        // Live calls first, then newest.
        orderBy: [{ id: 'desc' }],
        include: {
            clients: { select: { id: true, name: true } },
            agents: { select: { id: true, name: true } },
            campaigns: { select: { id: true, name: true } },
            contacts: { select: { id: true, phone: true } },
        },
        perPage: 25,
        page: params?.page ?? 1,
        path: '/admin/call-monitoring',
        query: { status: params?.status, client: params?.client },
        transform: (c) => ({
            id: Number(c.id),
            client: c.clients?.name ?? '—',
            agent: c.agents?.name ?? '—',
            campaign: c.campaigns?.name ?? null,
            status: c.status,
            live: LIVE.includes(c.status),
            sentiment: c.sentiment,
            engine: c.engine,
            duration_seconds: c.duration_seconds,
            phone: mask(c.contacts?.phone),
            started_at: iso(c.started_at),
        }),
    });

    // Live rows float to the top of the page, matching the controller's ordering.
    calls.data.sort((a, b) => Number(b.live) - Number(a.live));

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const today = { created_at: { gte: startOfDay } };

    const [activeNow, completedToday, failedToday, callsToday, avgAgg, clients] = await Promise.all([
        prisma.call.count({ where: { status: { in: LIVE } } }),
        prisma.call.count({ where: { ...today, status: 'completed' } }),
        prisma.call.count({ where: { ...today, status: { in: ['failed', 'no_answer', 'busy'] } } }),
        prisma.call.count({ where: today }),
        prisma.call.aggregate({
            where: { ...today, status: 'completed' },
            _avg: { duration_seconds: true },
        }),
        prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);

    const avg = Math.round(Number(avgAgg._avg.duration_seconds ?? 0));

    const props = {
        calls,
        filters: {
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.client ? { client: String(params.client) } : {}),
        },
        clients: plain(clients),
        statuses: ['ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'queued'],
        stats: [
            { label: 'Active now', value: String(activeNow), icon: 'phone-call', accent: 'signal' },
            { label: 'Completed today', value: String(completedToday), icon: 'check', accent: 'cold' },
            { label: 'Failed today', value: String(failedToday), icon: 'shield', accent: 'danger' },
            {
                label: 'Avg duration',
                value: `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, '0')}`,
                icon: 'clock',
                accent: 'brand',
            },
            { label: 'Calls today', value: String(callsToday), icon: 'activity', accent: 'warm' },
        ],
    };

    return renderPage(AdminCallMonitor, 'Admin/CallMonitor/Index', props, {
        url: '/admin/call-monitoring',
        isAdminRoute: true,
    });
}
