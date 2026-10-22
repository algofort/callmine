import IntegrationsIndex from '@/views/client/Integrations/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso, plain } from '@/lib/serialize';
import { AVAILABLE_EVENTS } from '@/lib/services/webhook-dispatcher';

export const dynamic = 'force-dynamic';

/** GET /app/integrations */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const client_id = BigInt(clientId);

    const webhooks = await prisma.webhook.findMany({
        where: { client_id },
        include: {
            campaigns: { select: { id: true, name: true } },
            _count: { select: { webhook_deliveries: true } },
        },
        orderBy: { id: 'desc' },
    });

    const [total, active, paused, campaigns] = await Promise.all([
        prisma.webhook.count({ where: { client_id } }),
        prisma.webhook.count({ where: { client_id, is_active: true } }),
        prisma.webhook.count({ where: { client_id, is_active: false } }),
        prisma.campaign.findMany({
            where: { client_id, deleted_at: null },
            select: { id: true, name: true },
        }),
    ]);

    const props = {
        webhooks: webhooks.map((w) => ({
            id: Number(w.id),
            name: w.name,
            target_url: w.target_url,
            events: w.events ?? [],
            campaign: w.campaigns?.name ?? null,
            campaign_id: w.campaign_id ? Number(w.campaign_id) : null,
            is_active: w.is_active,
            secret: w.secret,
            last_delivery_at: iso(w.last_delivery_at),
            last_status: w.last_status,
            deliveries_count: w._count.webhook_deliveries,
        })),
        stats: [
            { label: 'Total webhooks', value: String(total), icon: 'plug', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'check', accent: 'signal' },
            { label: 'Paused', value: String(paused), icon: 'lock', accent: 'cold' },
        ],
        availableEvents: AVAILABLE_EVENTS,
        campaigns: plain(campaigns),
    };

    return renderPage(IntegrationsIndex, 'client/Integrations/Index', props, {
        url: '/app/integrations',
    });
}
