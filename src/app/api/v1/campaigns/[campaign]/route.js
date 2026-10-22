import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { shapeCampaign } from '@/lib/api/shapes';

/** GET /api/v1/campaigns/{campaign} */
export const GET = apiRoute('campaigns:read', async (request, { params, clientId }) => {
    const { campaign: id } = await params;

    const campaign = await prisma.campaign.findUnique({
        where: { id: BigInt(id) },
        include: { _count: { select: { campaign_contact: true, calls: true } } },
    });

    if (!campaign || String(campaign.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    return apiJson(shapeCampaign(campaign));
});
