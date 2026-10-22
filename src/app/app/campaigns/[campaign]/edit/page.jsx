import { notFound, redirect } from 'next/navigation';
import CampaignWizard from '@/views/client/Campaigns/Wizard';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { STATUS, wizardData } from '@/lib/domain/campaigns';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/campaigns/{campaign}/edit */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { campaign: id } = await params;

    const campaign = await prisma.campaign.findUnique({
        where: { id: BigInt(id) },
        include: { campaign_contact: { select: { contact_id: true } } },
    });
    if (!campaign || String(campaign.client_id) !== String(clientId)) notFound();

    // Editing while dialing is unsafe; require draft or paused.
    if (![STATUS.DRAFT, STATUS.PAUSED].includes(campaign.status)) {
        redirect(`/app/campaigns/${id}`);
    }

    const props = {
        ...(await wizardData(clientId)),
        campaign: plain({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            goal: campaign.goal,
            agent_id: campaign.agent_id,
            phone_number_id: campaign.phone_number_id,
            max_retries: campaign.max_retries,
            retry_delay_minutes: campaign.retry_delay_minutes,
            schedule_start: campaign.schedule_start
                ? new Date(campaign.schedule_start).toISOString().slice(0, 16)
                : null,
            contact_ids: campaign.campaign_contact.map((p) => p.contact_id),
        }),
    };

    return renderPage(CampaignWizard, 'client/Campaigns/Wizard', props, {
        url: `/app/campaigns/${id}/edit`,
    });
}
