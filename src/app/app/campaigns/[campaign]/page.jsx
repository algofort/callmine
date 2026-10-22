import { notFound } from 'next/navigation';
import CampaignShow from '@/views/client/Campaigns/Show';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/campaigns/{campaign} */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { campaign: id } = await params;

    const campaign = await prisma.campaign.findUnique({
        where: { id: BigInt(id) },
        include: {
            agents: { select: { id: true, name: true } },
            phone_numbers: { select: { id: true, e164_number: true } },
            _count: { select: { campaign_contact: true, calls: true } },
        },
    });
    if (!campaign || String(campaign.client_id) !== String(clientId)) notFound();

    const props = {
        campaign: plain({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            goal: campaign.goal,
            status: campaign.status,
            agent: campaign.agents ? { id: campaign.agents.id, name: campaign.agents.name } : null,
            number: campaign.phone_numbers?.e164_number ?? null,
            contacts_count: campaign._count.campaign_contact,
            calls_count: campaign._count.calls,
            max_retries: campaign.max_retries,
            schedule_start: iso(campaign.schedule_start),
            stats: campaign.stats ?? null,
        }),
    };

    return renderPage(CampaignShow, 'client/Campaigns/Show', props, { url: `/app/campaigns/${id}` });
}
