import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back } from '@/lib/http';

/** DELETE /admin/notifications/{notification} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.notifications.destroy', 'manage_settings');
    if (gate.response) return gate.response;

    const { notification: id } = await params;
    await prisma.notification.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return back({ success: 'Notification deleted.' });
});
