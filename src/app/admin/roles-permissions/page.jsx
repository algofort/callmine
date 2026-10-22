import RolesPermissions from '@/views/Admin/RolesPermissions/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /admin/roles-permissions
 * (permission:view_admin_roles,manage_admin_roles — either is enough).
 */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_admin_roles', 'manage_admin_roles');
    const params = await searchParams;

    const roleWhere = {};
    if (params?.role_search) {
        const s = String(params.role_search);
        roleWhere.OR = [{ name: { contains: s } }, { key: { contains: s } }];
    }

    const permissionWhere = {};
    if (params?.permission_search) {
        const s = String(params.permission_search);
        permissionWhere.OR = [
            { key: { contains: s } },
            { name: { contains: s } },
            { category: { contains: s } },
        ];
    }

    const [roleRows, permissionRows] = await Promise.all([
        prisma.role.findMany({
            where: roleWhere,
            orderBy: { name: 'asc' },
            include: {
                role_permission: { select: { permission_id: true } },
                _count: { select: { role_permission: true, admin_role: true } },
            },
        }),
        prisma.permission.findMany({
            where: permissionWhere,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        }),
    ]);

    const props = {
        roles: roleRows.map((r) => ({
            id: Number(r.id),
            name: r.name,
            key: r.key,
            description: r.description,
            is_system: r.is_system,
            permissions_count: r._count.role_permission,
            admins_count: r._count.admin_role,
            permission_ids: r.role_permission.map((rp) => Number(rp.permission_id)),
        })),
        permissions: permissionRows.map((p) => ({
            id: Number(p.id),
            key: p.key,
            name: p.name,
            category: p.category,
            description: p.description,
        })),
        filters: {
            ...(params?.role_search ? { role_search: String(params.role_search) } : {}),
            ...(params?.permission_search ? { permission_search: String(params.permission_search) } : {}),
        },
    };

    return renderPage(RolesPermissions, 'Admin/RolesPermissions/Index', props, {
        url: '/admin/roles-permissions',
        isAdminRoute: true,
    });
}
