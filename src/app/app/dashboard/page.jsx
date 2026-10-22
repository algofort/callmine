import Dashboard from '@/views/client/Dashboard';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { effectiveSubscription, subscriptionIsActive } from '@/lib/auth';
import { balance } from '@/lib/services/credits';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/dashboard */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    const props = await buildProps(user, clientId);
    return renderPage(Dashboard, 'client/Dashboard', props, { url: '/app/dashboard' });
}

async function buildProps(user, clientId) {
    const effective = await effectiveSubscription(user);

    let currentPlan = null;
    let renewsAt = null;
    let managedByAdmin = false;

    if (effective?.plans) {
        currentPlan = {
            id: Number(effective.plans.id),
            name: effective.plans.name,
            slug: effective.plans.slug,
            status: subscriptionIsActive(effective) ? 'active' : (effective.status ?? 'inactive'),
        };
        if (effective.__kind === 'user') renewsAt = iso(effective.renews_at);
        if (effective.__kind === 'client') {
            renewsAt = iso(effective.ends_at);
            managedByAdmin = true;
        }
    }

    const isClientAdministrator = user.client_role === 'administrator';

    if (!clientId) {
        return {
            currentPlan,
            renewsAt,
            managedByAdmin,
            creditBalance: 0,
            kpis: null,
            onboarding: null,
            isClientAdministrator,
        };
    }

    const client_id = BigInt(clientId);
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const calls = await prisma.call.findMany({
        where: { client_id, created_at: { gte: start } },
        select: { status: true, sentiment: true, qualification: true, duration_seconds: true, created_at: true },
    });
    const completed = calls.filter((c) => c.status === 'completed');

    const callsByDay = [];
    for (let offset = 6; offset >= 0; offset--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - offset);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        callsByDay.push({
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            calls: await prisma.call.count({
                where: { client_id, created_at: { gte: day, lt: next } },
            }),
        });
    }

    const recent = await prisma.call.findMany({
        where: { client_id },
        include: { contacts: { select: { id: true, name: true, phone: true } } },
        orderBy: { id: 'desc' },
        take: 6,
    });

    const [agentsCount, numbersCount, contactsCount, activeCampaignCount, anyCampaign, creditBalance] =
        await Promise.all([
            prisma.agent.count({ where: { client_id } }),
            prisma.phoneNumber.count({ where: { client_id, status: 'active' } }),
            prisma.contact.count({ where: { client_id } }),
            prisma.campaign.count({ where: { client_id, status: 'active' } }),
            prisma.campaign.count({ where: { client_id } }),
            balance(clientId),
        ]);

    const activeCampaigns = await prisma.campaign.findMany({
        where: { client_id, status: 'active' },
        include: { _count: { select: { campaign_contact: true } } },
        orderBy: { id: 'desc' },
        take: 4,
    });

    const countBy = (field, value) => calls.filter((c) => c[field] === value).length;

    return {
        currentPlan,
        renewsAt,
        managedByAdmin,
        creditBalance,
        kpis: {
            total_calls: await prisma.call.count({ where: { client_id } }),
            calls_30d: calls.length,
            success_rate: calls.length ? Math.round((completed.length / calls.length) * 1000) / 10 : 0,
            qualified_leads: calls.filter((c) => ['hot', 'warm'].includes(c.qualification)).length,
            avg_duration: completed.length
                ? Math.round(
                      completed.reduce((sum, c) => sum + Number(c.duration_seconds ?? 0), 0) / completed.length,
                  )
                : 0,
            agents: agentsCount,
            numbers: numbersCount,
            contacts: contactsCount,
            active_campaigns: activeCampaignCount,
        },
        callsByDay,
        leadDistribution: [
            { name: 'Hot', value: countBy('qualification', 'hot') },
            { name: 'Warm', value: countBy('qualification', 'warm') },
            { name: 'Cold', value: countBy('qualification', 'cold') },
        ],
        recentCalls: recent.map((c) => ({
            id: Number(c.id),
            contact: c.contacts?.name ?? c.contacts?.phone ?? '—',
            status: c.status,
            sentiment: c.sentiment,
            qualification: c.qualification,
            duration_seconds: c.duration_seconds,
            created_at: iso(c.created_at),
        })),
        activeCampaigns: activeCampaigns.map((c) => ({
            id: Number(c.id),
            name: c.name,
            type: c.type,
            contacts_count: c._count.campaign_contact,
        })),
        onboarding: {
            has_agent: agentsCount > 0,
            has_number: numbersCount > 0,
            has_contacts: contactsCount > 0,
            has_campaign: anyCampaign > 0,
            has_credits: creditBalance > 0,
        },
        isClientAdministrator,
    };
}
