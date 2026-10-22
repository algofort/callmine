import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate, validationError } from '@/lib/http';

/** PUT /admin/permissions/{permission} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.permissions.update', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const { permission: id } = await params;
    const permission = await prisma.permission.findUnique({ where: { id: BigInt(id) } });
    if (!permission) return abort(404);

    const data = await validate(await readBody(request), {
        key: ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/'],
        name: ['required', 'string', 'max:255'],
        category: ['required', 'string', 'max:100'],
        description: ['nullable', 'string', 'max:500'],
    });

    const clash = await prisma.permission.findFirst({
        where: { key: data.key, id: { not: permission.id } },
    });
    if (clash) return validationError({ key: ['The key has already been taken.'] });

    await prisma.permission.update({
        where: { id: permission.id },
        data: {
            key: data.key,
            name: data.name,
            category: data.category,
            description: data.description ?? null,
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/roles-permissions', { success: 'Permission updated.' });
});

/** DELETE /admin/permissions/{permission} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.permissions.destroy', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const { permission: id } = await params;
    await prisma.permission.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return redirectTo('/admin/roles-permissions', { success: 'Permission deleted.' });
});
