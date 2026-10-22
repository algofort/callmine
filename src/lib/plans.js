import 'server-only';

import prisma from '@/lib/prisma';
import { subscriptionIsActive } from '@/lib/auth';

/** Port of App\Services\Plans\PlanLimits + . */

const COLUMNS = {
    agents: 'agents_limit',
    campaigns: 'campaigns_limit',
    contacts: 'contacts_limit',
    numbers: 'numbers_limit',
    kb_mb: 'kb_mb_limit',
};

const FEATURE_COLUMNS = {
    export: 'export_enabled',
    custom_domain: 'custom_domain_enabled',
    white_label: 'white_label_enabled',
    messaging: 'messaging_enabled',
    whatsapp: 'whatsapp_enabled',
    api: 'api_enabled',
    sip: 'sip_enabled',
};

export function planHasFeature(plan, feature) {
    const column = FEATURE_COLUMNS[feature];
    if (!plan || !column) return false;
    return !!plan[column];
}

/** — client subscription, else a member's own, else the free plan. */
export async function planFor(clientId) {
    if (!clientId) return prisma.plan.findFirst({ where: { slug: 'free' } });

    const cs = await prisma.clientSubscription.findFirst({
        where: { client_id: BigInt(clientId), status: 'active' },
        orderBy: { id: 'desc' },
        include: { plans: true },
    });
    if (cs && subscriptionIsActive(cs) && cs.plans) return cs.plans;

    const userSub = await prisma.subscription.findFirst({
        where: { status: { in: ['active', 'trialing'] }, users: { client_id: BigInt(clientId) } },
        orderBy: { id: 'desc' },
        include: { plans: true },
    });
    if (userSub?.plans) return userSub.plans;

    return prisma.plan.findFirst({ where: { slug: 'free' } });
}

export async function limitFor(clientId, key) {
    const column = COLUMNS[key];
    if (!column) return null;
    const plan = await planFor(clientId);
    return plan ? Number(plan[column] ?? 0) : 0;
}

export async function usageFor(clientId, key) {
    const client_id = BigInt(clientId);
    switch (key) {
        case 'agents':
            return prisma.agent.count({ where: { client_id } });
        case 'campaigns':
            return prisma.campaign.count({ where: { client_id } });
        case 'contacts':
            return prisma.contact.count({ where: { client_id } });
        case 'numbers':
            return prisma.phoneNumber.count({ where: { client_id, status: 'active' } });
        case 'kb_mb': {
            const agg = await prisma.knowledgeBaseItem.aggregate({
                where: { client_id },
                _sum: { file_size_bytes: true },
            });
            return Math.ceil(Number(agg._sum.file_size_bytes ?? 0) / 1048576);
        }
        default:
            return 0;
    }
}

export async function canCreate(clientId, key, adding = 1) {
    const limit = await limitFor(clientId, key);
    if (limit === null) return true;
    const usage = await usageFor(clientId, key);
    return usage + adding <= limit;
}

export async function remaining(clientId, key) {
    const limit = await limitFor(clientId, key);
    if (limit === null) return null;
    return Math.max(0, limit - (await usageFor(clientId, key)));
}

export async function planSummary(clientId) {
    const out = {};
    for (const key of Object.keys(COLUMNS)) {
        out[key] = {
            limit: await limitFor(clientId, key),
            usage: await usageFor(clientId, key),
            remaining: await remaining(clientId, key),
        };
    }
    return out;
}

export function priceCentsForCycle(plan, cycle) {
    if (!plan) return null;
    if (cycle === 'month') return plan.monthly_price_cents ?? plan.price_cents;
    if (cycle === 'year') return plan.yearly_price_cents;
    return null;
}
