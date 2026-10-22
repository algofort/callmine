import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back } from '@/lib/http';

/** POST /admin/batch-jobs/{campaign}/pause */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.batch-jobs.pause', 'manage_settings');
    if (gate.response) return gate.response;

    const { campaign: id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: BigInt(id) } });
    if (!campaign) return abort(404);

    // Only a active batch can be paused.
    if (campaign.status === 'active') {
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'paused', updated_at: new Date() },
        });
    }

    return back({ success: 'Batch paused.' });
});
