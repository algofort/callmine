import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { CLIENT_ROLE_KEYS, CLIENT_ROLE_NAMES, rbacCatalog, roleTemplate } from '@/lib/rbac-catalog.mjs';

/**
 * Team RBAC: seeding the permission catalog, keeping the four system roles in
 * step with it, and assigning a member their role.
 *
 * The catalog itself lives in `src/lib/rbac-catalog.mjs` — dependency-free, so
 * the standalone seed script reads the same definition rather than keeping its
 * own copy that can drift out of step with the permissions the guards check.
 */

export { CLIENT_ROLE_KEYS, CLIENT_ROLE_NAMES, rbacCatalog, roleTemplate };

/** Writes the catalog into `client_permissions`, updating what already exists. */
export async function seedCatalog() {
    for (const perm of rbacCatalog()) {
        const existing = await prisma.clientPermission.findUnique({ where: { key: perm.key } });
        if (existing) {
            await prisma.clientPermission.update({
                where: { id: existing.id },
                data: { ...perm, updated_at: new Date() },
            });
        } else {
            await prisma.clientPermission.create({
                data: { ...perm, created_at: new Date(), updated_at: new Date() },
            });
        }
    }
}

/** Creates the four system roles for one customer. Idempotent. */
export async function ensureSystemRoles(clientId) {
    await seedCatalog();

    const client_id = BigInt(clientId);

    for (const [key, name] of Object.entries(CLIENT_ROLE_NAMES)) {
        let role = await prisma.clientRole.findFirst({ where: { client_id, key } });
        if (!role) {
            role = await prisma.clientRole.create({
                data: { client_id, key, name, is_system: true, created_at: new Date(), updated_at: new Date() },
            });
        }

        await syncRolePermissions(role.id, roleTemplate(key));
    }
}

/** Replaces a role's permission set with exactly `permissionKeys`. */
export async function syncRolePermissions(roleId, permissionKeys) {
    const perms = await prisma.clientPermission.findMany({
        where: { key: { in: permissionKeys.length ? permissionKeys : [''] } },
        select: { id: true },
    });

    await prisma.clientRolePermission.deleteMany({ where: { client_role_id: roleId } });
    if (perms.length) {
        await prisma.clientRolePermission.createMany({
            data: perms.map((p) => ({ client_role_id: roleId, client_permission_id: p.id })),
            skipDuplicates: true,
        });
    }
}

/** Assigns a role — a member holds exactly one. */
export async function assignRole(userId, roleId) {
    await prisma.clientUserRole.deleteMany({ where: { user_id: BigInt(userId) } });
    await prisma.clientUserRole.create({
        data: { user_id: BigInt(userId), client_role_id: BigInt(roleId) },
    });
}

/** A short random suffix for generated role keys. */
export function randomKeySuffix(length = 8) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}
