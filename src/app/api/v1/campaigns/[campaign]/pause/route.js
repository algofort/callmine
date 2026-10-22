import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { shapeCampaign } from '@/lib/api/shapes';

/** POST /api/v1/campaigns/{campaign}/pause */
export const POST = apiRoute('campaigns:write', async (request, { params, clientId }) => {
    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });

    if (!campaign || String(campaign.client_id) !== String(clientId)) {
        return apiJson({ message: 'Not found.' }, 404);
    }

    const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'paused', updated_at: new Date() },
    });

    return apiJson(shapeCampaign(updated));
});
