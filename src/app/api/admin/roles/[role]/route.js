import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate, validationError } from '@/lib/http';
import { syncRolePermissions } from '@/lib/domain/admin-roles';

/** PUT /admin/roles/{role} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.roles.update', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const { role: id } = await params;
    const role = await prisma.role.findUnique({ where: { id: BigInt(id) } });
    if (!role) return abort(404);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        key: ['required', 'string', 'max:100', 'regex:/^[A-Z][A-Z0-9_]*$/'],
        description: ['nullable', 'string', 'max:500'],
        permission_ids: ['nullable', 'array'],
    });

    const clash = await prisma.role.findFirst({ where: { key: data.key, id: { not: role.id } } });
    if (clash) return validationError({ key: ['The key has already been taken.'] });

    // A system role keeps its key; only its name/description/permissions change.
    await prisma.role.update({
        where: { id: role.id },
        data: {
            name: data.name,
            description: data.description ?? null,
            ...(role.is_system ? {} : { key: data.key }),
            updated_at: new Date(),
        },
    });

    await syncRolePermissions(role.id, data.permission_ids ?? []);

    return redirectTo('/admin/roles-permissions', { success: 'Role updated.' });
});

/** DELETE /admin/roles/{role} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.roles.destroy', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const { role: id } = await params;
    const role = await prisma.role.findUnique({ where: { id: BigInt(id) } });
    if (!role) return abort(404);

    if (role.is_system) {
        return redirectTo('/admin/roles-permissions', { error: 'System role cannot be deleted.' });
    }

    const assigned = await prisma.adminRole.count({ where: { role_id: role.id } });
    if (assigned > 0) {
        return redirectTo('/admin/roles-permissions', {
            error: 'Cannot delete role that is assigned to admins.',
        });
    }

    await prisma.role.delete({ where: { id: role.id } });

    return redirectTo('/admin/roles-permissions', { success: 'Role deleted.' });
});
