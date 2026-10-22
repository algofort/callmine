import { notFound } from 'next/navigation';
import Referral from '@/views/client/Marketing/Referral';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import {
    REFERRAL_STATUS,
    firstOrCreateReferralSettings,
    obfuscateEmail,
    referralSettingsToArray,
    referralToArray,
    referralWhere,
} from '@/lib/domain/marketing';

export const dynamic = 'force-dynamic';

/** GET /app/marketing/referral */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const params = await searchParams;
    const client_id = BigInt(clientId);

    const settings = await firstOrCreateReferralSettings(clientId);

    let tab = params?.tab ?? 'settings';
    if (!['settings', 'referrals', 'analytics'].includes(tab)) tab = 'settings';

    const where = referralWhere(clientId, params);

    const referrals = await paginate(prisma.marketingReferral, {
        where,
        orderBy: { id: 'desc' },
        perPage: 10,
        page: params?.page ?? 1,
        path: '/app/marketing/referral',
        query: { tab, search: params?.search, status: params?.status },
        transform: referralToArray,
    });

    const props = {
        tab,
        settings: referralSettingsToArray(settings),
        referralStats: await referralStats(client_id),
        referrals,
        analytics: await referralAnalytics(client_id),
        filters: { search: params?.search ?? '', status: params?.status ?? '' },
    };

    return renderPage(Referral, 'client/Marketing/Referral', props, {
        url: '/app/marketing/referral',
    });
}

async function referralStats(client_id) {
    const [total, successful, rewardSum, pendingSum] = await Promise.all([
        prisma.marketingReferral.count({ where: { client_id } }),
        prisma.marketingReferral.count({ where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL } }),
        prisma.marketingReferral.aggregate({
            where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL },
            _sum: { reward_amount: true },
        }),
        prisma.marketingReferral.aggregate({
            where: { client_id, status: REFERRAL_STATUS.PENDING },
            _sum: { reward_amount: true },
        }),
    ]);

    return {
        total_referrals: total,
        conversion_rate: total > 0 ? Math.round((successful / total) * 1000) / 10 : 0,
        total_rewards: Number(rewardSum._sum.reward_amount ?? 0),
        pending_payouts: Number(pendingSum._sum.reward_amount ?? 0),
    };
}

async function referralAnalytics(client_id) {
    const [total, successful, avgAgg, converted] = await Promise.all([
        prisma.marketingReferral.count({ where: { client_id } }),
        prisma.marketingReferral.count({ where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL } }),
        prisma.marketingReferral.aggregate({
            where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL },
            _avg: { reward_amount: true },
        }),
        prisma.marketingReferral.findMany({
            where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL, converted_at: { not: null } },
            select: { created_at: true, converted_at: true },
        }),
    ]);

    const conversion = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;
    const avgReward = avgAgg._avg.reward_amount !== null
        ? Math.round(Number(avgAgg._avg.reward_amount) * 100) / 100
        : 0;

    let avgTimeToConvert = null;
    if (converted.length) {
        const days = converted.map(
            (r) => (new Date(r.converted_at) - new Date(r.created_at)) / 86400000,
        );
        avgTimeToConvert = Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10;
    }

    // 12 months ending this month.
    const monthlyGrowth = [];
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    from.setMonth(from.getMonth() - 11);

    for (let i = 0; i < 12; i++) {
        const start = new Date(from.getFullYear(), from.getMonth() + i, 1);
        const end = new Date(from.getFullYear(), from.getMonth() + i + 1, 1);

        monthlyGrowth.push({
            label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            count: await prisma.marketingReferral.count({
                where: { client_id, created_at: { gte: start, lt: end } },
            }),
        });
    }

    const best = [...monthlyGrowth].sort((a, b) => b.count - a.count)[0];
    const mostActiveMonth = best && best.count > 0 ? best.label : null;

    const topRows = await prisma.marketingReferral.groupBy({
        by: ['referrer_email'],
        where: { client_id, status: REFERRAL_STATUS.SUCCESSFUL, referrer_email: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { referrer_email: 'desc' } },
        take: 10,
    });

    const statusOrder = [
        REFERRAL_STATUS.PENDING,
        REFERRAL_STATUS.SUCCESSFUL,
        REFERRAL_STATUS.EXPIRED,
        REFERRAL_STATUS.CANCELLED,
    ];

    const statusDistribution = {};
    for (const st of statusOrder) {
        statusDistribution[st] = await prisma.marketingReferral.count({
            where: { client_id, status: st },
        });
    }

    const sumStatuses = Object.values(statusDistribution).reduce((a, b) => a + b, 0) || 1;
    const statusDistributionPct = {};
    for (const st of statusOrder) {
        statusDistributionPct[st] = Math.round((statusDistribution[st] / sumStatuses) * 1000) / 10;
    }

    return {
        conversion_rate: conversion,
        avg_reward: avgReward,
        avg_time_to_convert: avgTimeToConvert,
        most_active_month: mostActiveMonth,
        monthly_growth: monthlyGrowth,
        top_referrers: topRows.map((row) => ({
            email_obfuscated: obfuscateEmail(row.referrer_email),
            count: row._count._all,
        })),
        status_distribution: statusDistribution,
        status_distribution_pct: statusDistributionPct,
    };
}
