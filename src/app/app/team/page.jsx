import { notFound } from 'next/navigation';
import TeamIndex from '@/views/client/Team/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';
import { userCan } from '@/lib/auth';
import { planFor } from '@/lib/plans';
import { ensureSystemRoles, rbacCatalog } from '@/lib/services/client-rbac';

export const dynamic = 'force-dynamic';

/** GET /app/team (client.permission:team.read). */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    if (!clientId) notFound();
    if (!(await userCan(user, 'team.read'))) notFound();

    const client_id = BigInt(clientId);
    await ensureSystemRoles(clientId);

    const roles = await prisma.clientRole.findMany({
        where: { client_id },
        include: { client_role_permission: { include: { client_permissions: { select: { key: true } } } } },
        orderBy: { id: 'asc' },
    });

    const members = await prisma.user.findMany({
        where: { client_id },
        include: { client_user_role: { include: { client_roles: true } } },
        orderBy: { name: 'asc' },
    });

    const [membersTotal, membersActive, membersInactive] = await Promise.all([
        prisma.user.count({ where: { client_id } }),
        prisma.user.count({ where: { client_id, status: 'active' } }),
        prisma.user.count({ where: { client_id, status: 'inactive' } }),
    ]);

    const plan = await planFor(clientId);

    const props = {
        users: members.map((u) => {
            const assigned = u.client_user_role[0]?.client_roles;
            return {
                id: Number(u.id),
                name: u.name,
                email: u.email,
                status: u.status ?? 'active',
                role: assigned
                    ? { id: Number(assigned.id), key: assigned.key, name: assigned.name }
                    : u.client_role === 'administrator'
                      ? { key: 'owner', name: 'Owner (legacy)' }
                      : null,
                created_at: iso(u.created_at),
            };
        }),
        stats: [
            { label: 'Total members', value: membersTotal, icon: 'users', accent: 'brand' },
            { label: 'Active', value: membersActive, icon: 'check', accent: 'signal' },
            { label: 'Inactive', value: membersInactive, icon: 'lock', accent: 'warm' },
            { label: 'Roles', value: roles.length, icon: 'shield', accent: 'cold' },
        ],
        roles: roles.map((r) => ({
            id: Number(r.id),
            key: r.key,
            name: r.name,
            is_system: r.is_system,
            permissions: r.client_role_permission.map((rp) => rp.client_permissions.key),
        })),
        permissionCatalog: rbacCatalog(),
        seats: { limit: Number(plan?.team_seats_limit ?? 1), used: membersTotal },
        customRolesEnabled: !!plan?.custom_roles_enabled,
    };

    return renderPage(TeamIndex, 'client/Team/Index', props, { url: '/app/team' });
}
