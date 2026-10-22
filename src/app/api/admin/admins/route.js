import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { syncAdminRoles } from '@/lib/domain/admin-roles';

/** POST /admin/admins */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.admins.store', 'create_admins');
    if (gate.response) return gate.response;

    const data = await validate(
        await readBody(request),
        {
            name: ['required', 'string', 'max:255'],
            email: ['required', 'email', 'unique:admin_users,email'],
            password: ['required', 'string', 'min:8', 'confirmed'],
            status: ['required', 'in:ACTIVE,INACTIVE'],
            role_ids: ['nullable', 'array'],
        },
        { prisma },
    );

    const admin = await prisma.adminUser.create({
        data: {
            name: data.name,
            email: String(data.email).toLowerCase(),
            password: await hashPassword(data.password),
            status: data.status,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await syncAdminRoles(admin.id, data.role_ids ?? []);

    return redirectTo('/admin/admins', { success: 'Admin created.' });
});
