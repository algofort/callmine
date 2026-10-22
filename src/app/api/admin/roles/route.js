import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { syncRolePermissions } from '@/lib/domain/admin-roles';

/** POST /admin/roles */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.roles.store', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        // Role keys are SCREAMING_SNAKE_CASE.
        key: ['required', 'string', 'max:100', 'regex:/^[A-Z][A-Z0-9_]*$/'],
        description: ['nullable', 'string', 'max:500'],
        permission_ids: ['nullable', 'array'],
    });

    if (await prisma.role.findUnique({ where: { key: data.key } })) {
        return validationError({ key: ['The key has already been taken.'] });
    }

    const role = await prisma.role.create({
        data: {
            name: data.name,
            key: data.key,
            description: data.description ?? null,
            is_system: false,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await syncRolePermissions(role.id, data.permission_ids ?? []);

    return redirectTo('/admin/roles-permissions', { success: 'Role created.' });
});
