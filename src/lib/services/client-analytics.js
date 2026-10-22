import 'server-only';

import prisma from '@/lib/prisma';

/**
 * Port of App\Services\Client\ClientReportingAnalyticsService and
 * ClientAdvancedAnalyticsService — the /app/reporting/analytics payload.
 */

const TICKET_PALETTE = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    closed: '#6b7280',
};

const titleCase = (s) =>
    String(s)
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

export async function buildKpis(clientId) {
    const client_id = BigInt(clientId);
    const since = new Date(Date.now() - 30 * 86400000);

    const [teamMembers, totalTickets, openTickets, activity30d] = await Promise.all([
        prisma.user.count({ where: { client_id } }),
        prisma.customerSupportTicket.count({ where: { client_id } }),
        prisma.customerSupportTicket.count({
            where: { client_id, status: { in: ['open', 'in_progress'] } },
        }),
        prisma.auditLog.count({ where: { client_id, created_at: { gte: since } } }),
    ]);

    return { teamMembers, totalTickets, openTickets, activity30d };
}

export async function buildMonthlyActivityTrend(clientId, months) {
    const client_id = BigInt(clientId);
    const out = [];

    for (let i = months - 1; i >= 0; i--) {
        const anchor = new Date();
        anchor.setDate(1);
        anchor.setMonth(anchor.getMonth() - i);

        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1, 0, 0, 0, 0);

        out.push({
            month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            count: await prisma.auditLog.count({
                where: { client_id, created_at: { gte: start, lt: end } },
            }),
        });
    }

    return out;
}

export async function buildTicketStatusSegments(clientId) {
    const rows = await prisma.customerSupportTicket.groupBy({
        by: ['status'],
        where: { client_id: BigInt(clientId) },
        _count: { _all: true },
        orderBy: { _count: { status: 'desc' } },
    });

    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    if (total === 0) return [];

    return rows.map((row) => ({
        name: titleCase(String(row.status).replace(/_/g, ' ')),
        value: Math.round((100 * row._count._all) / total * 10) / 10,
        color: TICKET_PALETTE[row.status] ?? '#64748b',
    }));
}

export async function reportingPayload(clientId) {
    return {
        analytics: {
            kpis: await buildKpis(clientId),
            activityTrend: await buildMonthlyActivityTrend(clientId, 12),
            ticketStatus: await buildTicketStatusSegments(clientId),
        },
    };
}

async function buildWeeklyActivitySeries(clientId, weeks) {
    const client_id = BigInt(clientId);
    const out = [];

    for (let i = weeks - 1; i >= 0; i--) {
        const anchor = new Date();
        anchor.setDate(anchor.getDate() - i * 7);

        // startOfWeek(Monday)
        const day = anchor.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const ws = new Date(anchor);
        ws.setDate(ws.getDate() + diff);
        ws.setHours(0, 0, 0, 0);

        const we = new Date(ws);
        we.setDate(we.getDate() + 7);

        const label =
            `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ` +
            `${new Date(we.getTime() - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        out.push({
            label,
            value: await prisma.auditLog.count({ where: { client_id, created_at: { gte: ws, lt: we } } }),
        });
    }

    return out;
}

async function buildActivityByDay(clientId, days) {
    const client_id = BigInt(clientId);
    const out = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);

        const next = new Date(d);
        next.setDate(next.getDate() + 1);

        out.push({
            name: d.toLocaleDateString('en-US', { weekday: 'short' }),
            events: await prisma.auditLog.count({ where: { client_id, created_at: { gte: d, lt: next } } }),
        });
    }

    return out;
}

export async function advancedAnalyticsPayload(clientId) {
    const client_id = BigInt(clientId);
    const kpis = await buildKpis(clientId);
    const since = new Date(Date.now() - 30 * 86400000);

    const activeRows = await prisma.auditLog.findMany({
        where: { client_id, created_at: { gte: since }, user_id: { not: null } },
        distinct: ['user_id'],
        select: { user_id: true },
    });

    return {
        advancedAnalytics: {
            kpis: {
                teamMembers: kpis.teamMembers,
                activeUsers30d: activeRows.length,
                totalTickets: kpis.totalTickets,
                openTickets: kpis.openTickets,
            },
            overviewSeries: await buildWeeklyActivitySeries(clientId, 4),
            funnel: [
                { id: 'team', value: kpis.teamMembers },
                { id: 'tickets', value: kpis.totalTickets },
                { id: 'open', value: kpis.openTickets },
            ],
            segments: await buildTicketStatusSegments(clientId),
            activityByDay: await buildActivityByDay(clientId, 7),
        },
    };
}
