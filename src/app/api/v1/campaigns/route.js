import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { paginate } from '@/lib/paginate';
import { pageFrom, perPageFrom, shapeCampaign } from '@/lib/api/shapes';
import { readBody, validate } from '@/lib/http';
import { TYPES } from '@/lib/domain/campaigns';

/** GET /api/v1/campaigns */
export const GET = apiRoute('campaigns:read', async (request, { clientId }) => {
    const items = await paginate(prisma.campaign, {
        where: { client_id: clientId, deleted_at: null },
        orderBy: { id: 'desc' },
        include: { _count: { select: { campaign_contact: true, calls: true } } },
        perPage: perPageFrom(request),
        page: pageFrom(request),
        path: '/api/v1/campaigns',
        transform: shapeCampaign,
    });

    return apiJson(items);
});

/** POST /api/v1/campaigns */
export const POST = apiRoute('campaigns:write', async (request, { clientId }) => {
    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        type: ['required', `in:${TYPES.join(',')}`],
        goal: ['nullable', 'string', 'max:2000'],
        agent_id: ['nullable', 'integer'],
        phone_number_id: ['nullable', 'integer'],
    });

    const errors = {};
    if (data.agent_id) {
        const agent = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id: clientId, deleted_at: null },
        });
        if (!agent) errors.agent_id = ['The selected agent id is invalid.'];
    }
    if (data.phone_number_id) {
        const number = await prisma.phoneNumber.findFirst({
            where: { id: BigInt(data.phone_number_id), client_id: clientId },
        });
        if (!number) errors.phone_number_id = ['The selected phone number id is invalid.'];
    }
    if (Object.keys(errors).length) {
        return apiJson({ message: 'The given data was invalid.', errors }, 422);
    }

    const campaign = await prisma.campaign.create({
        data: {
            client_id: clientId,
            name: data.name,
            type: data.type,
            goal: data.goal ?? null,
            agent_id: data.agent_id ? BigInt(data.agent_id) : null,
            phone_number_id: data.phone_number_id ? BigInt(data.phone_number_id) : null,
            status: 'draft',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return apiJson(shapeCampaign(campaign), 201);
});
