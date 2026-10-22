import AdminAdmins from '@/views/Admin/Admins/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/admins (permission:view_admins). */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_admins');
    const params = await searchParams;

    const where = {};
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ name: { contains: s } }, { email: { contains: s } }];
    }

    const admins = await paginate(prisma.adminUser, {
        where,
        orderBy: { created_at: 'desc' },
        include: { admin_role: { include: { roles: true } } },
        perPage: 15,
        page: params?.page ?? 1,
        path: '/admin/admins',
        query: { search: params?.search },
        transform: (a) => ({
            id: Number(a.id),
            name: a.name,
            email: a.email,
            status: a.status,
            roles: a.admin_role.map((ar) => ({
                id: Number(ar.roles.id),
                key: ar.roles.key,
                name: ar.roles.name,
            })),
            created_at: iso(a.created_at),
        }),
    });

    const [roles, total, active, roleCount] = await Promise.all([
        prisma.role.findMany({ orderBy: { name: 'asc' }, select: { id: true, key: true, name: true } }),
        prisma.adminUser.count(),
        prisma.adminUser.count({ where: { status: 'ACTIVE' } }),
        prisma.role.count(),
    ]);

    const props = {
        admins,
        roles: plain(roles),
        stats: [
            { label: 'Total Admins', value: total, icon: 'shield', accent: 'brand' },
            { label: 'Active', value: active, icon: 'check', accent: 'signal' },
            { label: 'Roles', value: roleCount, icon: 'lock', accent: 'cold' },
        ],
        filters: params?.search ? { search: String(params.search) } : {},
    };

    return renderPage(AdminAdmins, 'Admin/Admins/Index', props, {
        url: '/admin/admins',
        isAdminRoute: true,
    });
}
