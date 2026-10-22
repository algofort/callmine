import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back } from '@/lib/http';

/** POST /admin/call-queue/{callQueueJob}/retry */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.call-queue.retry', 'manage_settings');
    if (gate.response) return gate.response;

    const { callQueueJob: id } = await params;

    await prisma.callQueueJob
        .update({
            where: { id: BigInt(id) },
            data: {
                status: 'pending',
                scheduled_for: new Date(),
                locked_at: null,
                last_error: null,
                updated_at: new Date(),
            },
        })
        .catch(() => {});

    return back({ success: 'Job requeued.' });
});
