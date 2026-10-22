import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';

/** GET /api/v1/analytics */
export const GET = apiRoute('analytics:read', async (request, { clientId }) => {
    let days = Number(new URL(request.url).searchParams.get('days') ?? 30);
    if (![7, 30, 90].includes(days)) days = 30;

    const calls = await prisma.call.findMany({
        where: { client_id: clientId, created_at: { gte: new Date(Date.now() - days * 86400000) } },
        select: { status: true, qualification: true },
    });

    const total = calls.length;
    const completed = calls.filter((c) => c.status === 'completed').length;
    const countBy = (q) => calls.filter((c) => c.qualification === q).length;

    return apiJson({
        range_days: days,
        total_calls: total,
        success_rate: total ? Math.round((completed / total) * 1000) / 10 : 0,
        qualified_leads: calls.filter((c) => ['hot', 'warm'].includes(c.qualification)).length,
        lead_distribution: { hot: countBy('hot'), warm: countBy('warm'), cold: countBy('cold') },
    });
});
