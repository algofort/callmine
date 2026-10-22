import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';

/** POST /admin/permissions */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.permissions.store', 'manage_admin_roles');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        // Permission keys are lower_snake_case.
        key: ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/'],
        name: ['required', 'string', 'max:255'],
        category: ['required', 'string', 'max:100'],
        description: ['nullable', 'string', 'max:500'],
    });

    if (await prisma.permission.findUnique({ where: { key: data.key } })) {
        return validationError({ key: ['The key has already been taken.'] });
    }

    await prisma.permission.create({
        data: {
            key: data.key,
            name: data.name,
            category: data.category,
            description: data.description ?? null,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/roles-permissions', { success: 'Permission created.' });
});
