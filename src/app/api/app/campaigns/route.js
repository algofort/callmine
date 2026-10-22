import prisma from '@/lib/prisma';
import { gateClient, gatePlanLimit, handler } from '@/lib/guards';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import {
    STATUS,
    assertOwnedRefs,
    attachContacts,
    campaignRules,
    resolveContactIds,
} from '@/lib/domain/campaigns';

/** POST /app/campaigns (plan.limit:campaigns). */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.campaigns.store' });
    if (gate.response) return gate.response;

    const limited = await gatePlanLimit(gate.clientId, 'campaigns');
    if (limited) return limited;

    const body = await readBody(request);
    const data = await validate(body, campaignRules(), { prisma });

    const refErrors = await assertOwnedRefs(data, gate.clientId);
    if (refErrors) return validationError(refErrors);

    const campaign = await prisma.campaign.create({
        data: {
            client_id: BigInt(gate.clientId),
            user_id: gate.user.id,
            name: data.name,
            type: data.type,
            goal: data.goal ?? null,
            agent_id: data.agent_id ? BigInt(data.agent_id) : null,
            phone_number_id: data.phone_number_id ? BigInt(data.phone_number_id) : null,
            max_retries: data.max_retries ?? 3,
            retry_delay_minutes: data.retry_delay_minutes ?? 60,
            schedule_start: data.schedule_start ? new Date(data.schedule_start) : null,
            status: STATUS.DRAFT,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await attachContacts(campaign.id, await resolveContactIds(body, gate.clientId));

    return redirectTo(`/app/campaigns/${Number(campaign.id)}`, {
        success: 'Campaign created as a draft.',
    });
});
