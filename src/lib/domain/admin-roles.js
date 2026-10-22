import 'server-only';

import prisma from '@/lib/prisma';

/** `$admin->roles()->sync($ids)` */
export async function syncAdminRoles(adminUserId, roleIds) {
    await prisma.adminRole.deleteMany({ where: { admin_user_id: adminUserId } });

    const ids = (roleIds ?? []).map((id) => BigInt(id));
    if (!ids.length) return;

    await prisma.adminRole.createMany({
        data: ids.map((role_id) => ({ admin_user_id: adminUserId, role_id })),
        skipDuplicates: true,
    });
}

/** `$role->permissions()->sync($ids)` */
export async function syncRolePermissions(roleId, permissionIds) {
    await prisma.rolePermission.deleteMany({ where: { role_id: roleId } });

    const ids = (permissionIds ?? []).map((id) => BigInt(id));
    if (!ids.length) return;

    await prisma.rolePermission.createMany({
        data: ids.map((permission_id) => ({ role_id: roleId, permission_id })),
        skipDuplicates: true,
    });
}

/** How many admins hold the SUPER_ADMIN role. */
export async function superAdminCount() {
    return prisma.adminRole.count({ where: { roles: { key: 'SUPER_ADMIN' } } });
}
