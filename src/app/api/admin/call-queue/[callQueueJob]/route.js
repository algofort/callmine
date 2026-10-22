import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back } from '@/lib/http';

/** DELETE /admin/call-queue/{callQueueJob} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.call-queue.cancel', 'manage_settings');
    if (gate.response) return gate.response;

    const { callQueueJob: id } = await params;
    await prisma.callQueueJob.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return back({ success: 'Job removed from the queue.' });
});
