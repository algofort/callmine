import 'server-only';

import prisma from '@/lib/prisma';
import { assignRole, ensureSystemRoles, CLIENT_ROLE_KEYS } from '@/lib/services/client-rbac';

/**
 * Team-role plumbing shared by the admin screens that create and edit customer
 * users.
 *
 * `clientPermissionKeys()` fails closed — a member holding no team role holds no
 * permissions — so every non-administrator user must leave these screens with a
 * role attached. Administrators short-circuit to full access and carry no team
 * role of their own.
 */

/** The client's team roles, lightest privilege first, for a role picker. */
export async function teamRoleOptions(clientId) {
    await ensureSystemRoles(clientId);

    const order = [CLIENT_ROLE_KEYS.VIEWER, CLIENT_ROLE_KEYS.MANAGER, CLIENT_ROLE_KEYS.ADMIN, CLIENT_ROLE_KEYS.OWNER];
    const roles = await prisma.clientRole.findMany({
        where: { client_id: BigInt(clientId) },
        orderBy: { id: 'asc' },
    });

    return roles
        .map((r) => ({ id: Number(r.id), key: r.key, name: r.name, is_system: Boolean(r.is_system) }))
        .sort((a, b) => {
            const ai = order.indexOf(a.key);
            const bi = order.indexOf(b.key);
            return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
        });
}

/** The team role a customer user currently holds, or null. */
export async function currentRoleId(userId) {
    const row = await prisma.clientUserRole.findFirst({
        where: { user_id: BigInt(userId) },
        select: { client_role_id: true },
    });
    return row ? Number(row.client_role_id) : null;
}

/**
 * Attaches the correct team role to a customer user.
 *
 * - `administrator` — drops any team role; the account-admin flag already grants
 *   full access and a stale role row would only confuse the team screen.
 * - `staff` — assigns the requested role when it belongs to this client,
 *   otherwise falls back to the least-privileged system role (Viewer). Never
 *   leaves a staff member role-less.
 *
 * Returns the assigned role id, or null for administrators.
 */
export async function applyTeamRole(user, clientId, clientRole, requestedRoleId = null) {
    if (clientRole === 'administrator') {
        await prisma.clientUserRole.deleteMany({ where: { user_id: BigInt(user.id) } });
        return null;
    }

    await ensureSystemRoles(clientId);

    let role = null;
    if (requestedRoleId) {
        role = await prisma.clientRole.findFirst({
            where: { id: BigInt(requestedRoleId), client_id: BigInt(clientId) },
        });
    }

    if (!role) {
        role = await prisma.clientRole.findFirst({
            where: { client_id: BigInt(clientId), key: CLIENT_ROLE_KEYS.VIEWER },
        });
    }

    if (!role) return null;

    await assignRole(user.id, role.id);
    return Number(role.id);
}
