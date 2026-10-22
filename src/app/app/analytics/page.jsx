import AnalyticsIndex from '@/views/client/Analytics/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /app/analytics */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    let days = parseInt(params?.days ?? '30', 10);
    if (![7, 30, 90].includes(days)) days = 30;

    const start = new Date(Date.now() - days * 86400000);
    const prevStart = new Date(start.getTime() - days * 86400000);

    const [calls, prevCalls] = await Promise.all([
        prisma.call.findMany({
            where: { client_id, created_at: { gte: start } },
            select: {
                status: true,
                sentiment: true,
                qualification: true,
                duration_seconds: true,
                campaign_id: true,
                created_at: true,
            },
        }),
        prisma.call.findMany({
            where: { client_id, created_at: { gte: prevStart, lt: start } },
            select: { status: true, qualification: true },
        }),
    ]);

    const total = calls.length;
    const completed = calls.filter((c) => c.status === 'completed');
    const qualified = calls.filter((c) => ['hot', 'warm'].includes(c.qualification)).length;
    const avgDuration = completed.length
        ? Math.round(completed.reduce((s, c) => s + Number(c.duration_seconds ?? 0), 0) / completed.length)
        : 0;

    const prevTotal = prevCalls.length;
    const prevQualified = prevCalls.filter((c) => ['hot', 'warm'].includes(c.qualification)).length;

    // Calls per day (last 7 days within the range).
    const callsByDay = [];
    for (let offset = 6; offset >= 0; offset--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - offset);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        callsByDay.push({
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            calls: calls.filter((c) => c.created_at >= day && c.created_at < next).length,
        });
    }

    const countBy = (field, value) => calls.filter((c) => c[field] === value).length;
    const title = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const recentCampaigns = await prisma.campaign.findMany({
        where: { client_id, deleted_at: null },
        orderBy: { id: 'desc' },
        take: 5,
        select: { id: true, name: true },
    });

    const campaignSuccess = [];
    for (const c of recentCampaigns) {
        const [cTotal, cDone] = await Promise.all([
            prisma.call.count({ where: { campaign_id: c.id } }),
            prisma.call.count({ where: { campaign_id: c.id, status: 'completed' } }),
        ]);
        campaignSuccess.push({ name: c.name, success: cTotal ? Math.round((cDone / cTotal) * 100) : 0 });
    }

    const props = {
        days,
        kpis: {
            total_calls: total,
            success_rate: total ? Math.round((completed.length / total) * 1000) / 10 : 0,
            qualified_leads: qualified,
            avg_duration: avgDuration,
            calls_trend: trend(total, prevTotal),
            qualified_trend: trend(qualified, prevQualified),
        },
        charts: {
            calls_by_day: callsByDay,
            lead_distribution: ['hot', 'warm', 'cold'].map((q) => ({
                name: title(q),
                value: countBy('qualification', q),
            })),
            sentiment: ['positive', 'neutral', 'negative'].map((s) => ({
                name: title(s),
                value: countBy('sentiment', s),
            })),
            campaign_success: campaignSuccess,
        },
    };

    return renderPage(AnalyticsIndex, 'client/Analytics/Index', props, { url: '/app/analytics' });
}

function trend(current, previous) {
    if (previous === 0) return current > 0 ? 100.0 : null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}
