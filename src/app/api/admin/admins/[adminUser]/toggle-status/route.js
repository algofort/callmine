import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, redirectTo } from '@/lib/http';

/** POST /admin/admins/{adminUser}/toggle-status — ::toggleStatus() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.admins.toggle-status', 'update_admins');
    if (gate.response) return gate.response;

    const { adminUser: id } = await params;
    const target = await prisma.adminUser.findUnique({ where: { id: BigInt(id) } });
    if (!target) return abort(404);

    if (String(target.id) === String(gate.admin.id)) {
        return redirectTo('/admin/admins', { error: 'You cannot deactivate yourself.' });
    }

    await prisma.adminUser.update({
        where: { id: target.id },
        data: {
            status: target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/admins', { success: 'Status updated.' });
});
