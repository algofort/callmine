import 'server-only';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAdminSession, getSession } from './session';

/* ------------------------------------------------------------- passwords */

/**
 * Passwords are bcrypt hashes; bcryptjs also verifies the `$2y$` prefix,
 * so existing users keep working without a password reset.
 */
export async function verifyPassword(plain, hash) {
    if (!plain || !hash) return false;
    try {
        return await bcrypt.compare(plain, hash);
    } catch {
        return false;
    }
}

export async function hashPassword(plain) {
    return bcrypt.hash(plain, 12);
}

/* ----------------------------------------------------------------- guards */

/** `$request->user()` — the web guard. Returns null when logged out or inactive. */
export async function currentUser() {
    const session = await getSession();
    if (!session?.uid) return null;

    const user = await prisma.user.findUnique({
        where: { id: BigInt(session.uid) },
        include: { clients: true },
    });
    if (!user) return null;
    if ((user.status ?? 'active') !== 'active') return null;

    return user;
}

/** `$request->user('admin')` — the admin guard. */
export async function currentAdmin() {
    const session = await getAdminSession();
    if (!session?.uid) return null;

    const admin = await prisma.adminUser.findUnique({ where: { id: BigInt(session.uid) } });
    if (!admin || admin.status !== 'ACTIVE') return null;

    return admin;
}

/* ------------------------------------------------------------ admin RBAC */

export async function adminPermissionKeys(adminId) {
    const rows = await prisma.adminRole.findMany({
        where: { admin_user_id: BigInt(adminId) },
        include: { roles: { include: { role_permission: { include: { permissions: true } } } } },
    });

    const keys = new Set();
    for (const row of rows) {
        for (const rp of row.roles?.role_permission ?? []) {
            if (rp.permissions?.key) keys.add(rp.permissions.key);
        }
    }
    return [...keys];
}

export async function adminIsSuper(adminId) {
    // Role::KEY_SUPER_ADMIN is the uppercase 'SUPER_ADMIN'.
    const row = await prisma.adminRole.findFirst({
        where: { admin_user_id: BigInt(adminId), roles: { key: 'SUPER_ADMIN' } },
    });
    return !!row;
}

export async function adminCan(adminId, permissionKey) {
    if (await adminIsSuper(adminId)) return true;
    const keys = await adminPermissionKeys(adminId);
    return keys.includes(permissionKey);
}

/* ----------------------------------------------------------- client RBAC */

/**
 * Resolves the permission keys a customer-side user holds.
 *
 * Account administrators get full access ('*'). Every other member is granted
 * exactly what their assigned team role carries — a member with no role holds
 * no permissions at all. This resolver fails closed on purpose: an unassigned
 * member must never inherit administrator rights.
 */
export async function clientPermissionKeys(user) {
    if (!user) return [];
    if (user.client_role === 'administrator') return ['*'];

    const roles = await prisma.clientUserRole.findMany({
        where: { user_id: user.id },
        include: {
            client_roles: {
                include: { client_role_permission: { include: { client_permissions: true } } },
            },
        },
    });

    // Fail closed: no role assigned means no permissions.
    if (roles.length === 0) return [];

    const keys = new Set();
    for (const row of roles) {
        for (const rp of row.client_roles?.client_role_permission ?? []) {
            if (rp.client_permissions?.key) keys.add(rp.client_permissions.key);
        }
    }
    return [...keys];
}

export async function userCan(user, permissionKey) {
    const keys = await clientPermissionKeys(user);
    return keys.includes('*') || keys.includes(permissionKey);
}

/* --------------------------------------------------------------- helpers */

/** Current calling-credit balance for a client (). */
export async function creditBalance(clientId) {
    if (!clientId) return 0;
    const row = await prisma.creditLedger.findFirst({
        where: { client_id: BigInt(clientId) },
        orderBy: { id: 'desc' },
        select: { balance_after: true },
    });
    return Number(row?.balance_after ?? 0);
}

/** Tenants the user owns plus those they belong to (). */
export async function accessibleTenants(user) {
    if (!user) return [];

    const [owned, memberships] = await Promise.all([
        prisma.tenant.findMany({ where: { owner_id: user.id } }),
        prisma.tenantUser.findMany({ where: { user_id: user.id }, include: { tenants: true } }),
    ]);

    const byId = new Map();
    for (const t of owned) byId.set(String(t.id), t);
    for (const m of memberships) if (m.tenants) byId.set(String(m.tenants.id), m.tenants);

    return [...byId.values()];
}

export async function tenantAccessibleBy(tenant, user) {
    if (!tenant || !user) return false;
    if (tenant.owner_id && tenant.owner_id === user.id) return true;
    if (user.tenant_id && user.tenant_id === tenant.id) return true;

    const pivot = await prisma.tenantUser.findFirst({
        where: { tenant_id: tenant.id, user_id: user.id },
    });
    return !!pivot;
}

/**
 * — the client's active subscription when the
 * user belongs to a client, otherwise the user's own.
 */
export async function effectiveSubscription(user) {
    if (!user) return null;

    if (user.client_id) {
        const cs = await prisma.clientSubscription.findFirst({
            where: { client_id: user.client_id, status: 'active' },
            orderBy: { id: 'desc' },
            include: { plans: true },
        });
        if (cs && subscriptionIsActive(cs)) return { ...cs, __kind: 'client' };
    }

    const sub = await prisma.subscription.findFirst({
        where: { user_id: user.id, status: { in: ['active', 'trialing'] } },
        orderBy: { id: 'desc' },
        include: { plans: true },
    });
    return sub ? { ...sub, __kind: 'user' } : null;
}

export function subscriptionIsActive(sub) {
    if (!sub) return false;
    if (!['active', 'trialing'].includes(sub.status)) return false;
    if (sub.ends_at && new Date(sub.ends_at) < new Date()) return false;
    return true;
}
