import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { STATUS } from '@/lib/domain/campaigns';

/** POST /app/campaigns/{campaign}/pause */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.campaigns.pause' });
    if (gate.response) return gate.response;

    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });
    assertOwned(campaign, gate.clientId);

    await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: STATUS.PAUSED, updated_at: new Date() },
    });

    return back({ success: 'Campaign paused.' });
});
