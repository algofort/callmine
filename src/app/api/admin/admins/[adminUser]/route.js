import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate, validationError } from '@/lib/http';
import { adminIsSuper } from '@/lib/auth';
import { superAdminCount, syncAdminRoles } from '@/lib/domain/admin-roles';

/** PUT /admin/admins/{adminUser} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.admins.update', 'update_admins');
    if (gate.response) return gate.response;

    const { adminUser: id } = await params;
    const target = await prisma.adminUser.findUnique({ where: { id: BigInt(id) } });
    if (!target) return abort(404);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email'],
        status: ['required', 'in:ACTIVE,INACTIVE'],
        role_ids: ['nullable', 'array'],
    });

    const email = String(data.email).toLowerCase();
    const clash = await prisma.adminUser.findFirst({ where: { email, id: { not: target.id } } });
    if (clash) return validationError({ email: ['The email has already been taken.'] });

    await prisma.adminUser.update({
        where: { id: target.id },
        data: { name: data.name, email, status: data.status, updated_at: new Date() },
    });

    await syncAdminRoles(target.id, data.role_ids ?? []);

    return redirectTo('/admin/admins', { success: 'Admin updated.' });
});

/** DELETE /admin/admins/{adminUser} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.admins.destroy', 'delete_admins');
    if (gate.response) return gate.response;

    const { adminUser: id } = await params;
    const target = await prisma.adminUser.findUnique({ where: { id: BigInt(id) } });
    if (!target) return abort(404);

    if (String(target.id) === String(gate.admin.id)) {
        return redirectTo('/admin/admins', { error: 'You cannot delete yourself.' });
    }

    // Never remove the last Super Admin.
    if (await adminIsSuper(target.id)) {
        if ((await superAdminCount()) <= 1) {
            return redirectTo('/admin/admins', { error: 'Cannot delete the last Super Admin.' });
        }
    }

    await prisma.adminUser.delete({ where: { id: target.id } });

    return redirectTo('/admin/admins', { success: 'Admin deleted.' });
});
