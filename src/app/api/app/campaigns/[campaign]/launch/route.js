import prisma from '@/lib/prisma';
import { assertOwned, gateClient, gateKyc, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { STATUS } from '@/lib/domain/campaigns';

/**
 * POST /app/campaigns/{campaign}/launch
 * (middleware kyc.verified). Bulk-inserts one call_queue_jobs row per not-yet-queued
 * contact; the dialer consumes them.
 */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.campaigns.launch' });
    if (gate.response) return gate.response;

    const kyc = await gateKyc(gate.user);
    if (kyc) return kyc;

    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });
    assertOwned(campaign, gate.clientId);

    // A draft or paused campaign can launch; a completed one uses resume/clone.
    if (![STATUS.DRAFT, STATUS.PAUSED].includes(campaign.status)) {
        return back({ error: 'This campaign cannot be launched from its current state.' });
    }
    if (!campaign.agent_id || !campaign.phone_number_id) {
        return back({ error: 'Assign an agent and a phone number before launching.' });
    }

    const contactCount = await prisma.campaignContact.count({ where: { campaign_id: campaign.id } });
    if (contactCount === 0) return back({ error: 'Add contacts before launching.' });

    const scheduledFor = campaign.schedule_start ?? new Date();
    const now = new Date();

    // Contacts on this campaign that have no queue job yet.
    const pivots = await prisma.campaignContact.findMany({
        where: { campaign_id: campaign.id },
        select: { contact_id: true },
    });
    const existing = await prisma.callQueueJob.findMany({
        where: { campaign_id: campaign.id },
        select: { contact_id: true },
    });
    const queued = new Set(existing.map((j) => String(j.contact_id)));
    const pending = pivots.filter((p) => !queued.has(String(p.contact_id)));

    // Insert in chunks so a large campaign does not build one huge statement.
    for (let i = 0; i < pending.length; i += 500) {
        await prisma.callQueueJob.createMany({
            data: pending.slice(i, i + 500).map((p) => ({
                client_id: campaign.client_id,
                campaign_id: campaign.id,
                contact_id: p.contact_id,
                agent_id: campaign.agent_id,
                phone_number_id: campaign.phone_number_id,
                status: 'pending',
                scheduled_for: scheduledFor,
                max_retries: campaign.max_retries,
                created_at: now,
                updated_at: now,
            })),
            skipDuplicates: true,
        });
    }

    await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: STATUS.ACTIVE, updated_at: now },
    });

    return back({ success: 'Campaign launched.' });
});
