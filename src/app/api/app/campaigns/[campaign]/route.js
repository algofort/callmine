import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, redirectTo, validate, validationError } from '@/lib/http';
import {
    STATUS,
    assertOwnedRefs,
    attachContacts,
    campaignRules,
    resolveContactIds,
    syncContacts,
} from '@/lib/domain/campaigns';

/** PUT /app/campaigns/{campaign} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.campaigns.update' });
    if (gate.response) return gate.response;

    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });
    assertOwned(campaign, gate.clientId);

    if (![STATUS.DRAFT, STATUS.PAUSED].includes(campaign.status)) {
        return back({ error: 'Pause the campaign before editing it.' });
    }

    const body = await readBody(request);
    const data = await validate(body, campaignRules(), { prisma });

    const refErrors = await assertOwnedRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
            name: data.name,
            type: data.type,
            goal: data.goal ?? null,
            agent_id: data.agent_id ? BigInt(data.agent_id) : null,
            phone_number_id: data.phone_number_id ? BigInt(data.phone_number_id) : null,
            max_retries: data.max_retries ?? 3,
            retry_delay_minutes: data.retry_delay_minutes ?? 60,
            schedule_start: data.schedule_start ? new Date(data.schedule_start) : null,
            updated_at: new Date(),
        },
    });

    // Only touch the pivot when a selection was actually sent, so a plain settings
    // edit does not wipe the campaign's contacts.
    if (body.select_all) {
        await syncContacts(campaign.id, await resolveContactIds(body, gate.clientId));
    } else if ('contact_ids' in body) {
        await attachContacts(campaign.id, await resolveContactIds(body, gate.clientId));
    }

    return redirectTo(`/app/campaigns/${Number(campaign.id)}`, { success: 'Campaign updated.' });
});

/** DELETE /app/campaigns/{campaign} (soft delete). */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.campaigns.destroy' });
    if (gate.response) return gate.response;

    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });
    assertOwned(campaign, gate.clientId);

    await prisma.campaign.update({
        where: { id: campaign.id },
        data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return redirectTo('/app/campaigns', { success: 'Campaign deleted.' });
});
