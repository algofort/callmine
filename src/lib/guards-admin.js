import 'server-only';

import { redirect } from 'next/navigation';
import { adminCan, adminIsSuper, currentAdmin } from '@/lib/auth';
import { abort } from '@/lib/http';
import { demoBlocked } from '@/lib/guards';

/**
 * `permission:view_settings` / `permission:a,b` — the admin RBAC gate.
 * hasAnyPermission(): holding ANY of the listed keys is enough.
 */
export async function requireAdminPermissions(...permissions) {
    const admin = await currentAdmin();
    if (!admin) redirect('/admin/login');

    if (permissions.length === 0) return admin;
    if (await adminIsSuper(admin.id)) return admin;

    for (const permission of permissions) {
        if (await adminCan(admin.id, permission)) return admin;
    }

    redirect('/admin/dashboard');
}

/** The API-side equivalent, returning a Response instead of redirecting. */
export async function gateAdminPermissions(routeName, ...permissions) {
    const demo = demoBlocked(routeName);
    if (demo) return { response: demo };

    const admin = await currentAdmin();
    if (!admin) return { response: abort(401) };

    if (permissions.length === 0) return { admin };
    if (await adminIsSuper(admin.id)) return { admin };

    for (const permission of permissions) {
        if (await adminCan(admin.id, permission)) return { admin };
    }

    return { response: abort(403, 'You do not have permission to perform this action.') };
}
