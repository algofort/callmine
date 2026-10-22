import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, redirectTo } from '@/lib/http';
import { getSession, writeSession } from '@/lib/auth/session';
import { logAdminAudit } from '@/lib/services/audit-log';

/** POST /admin/clients/{client}/impersonate */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.impersonate', 'view_clients');
    if (gate.response) return gate.response;

    const session = await getSession();
    if (session?.impersonating) {
        return redirectTo('/admin/clients', { error: 'Already impersonating.' });
    }

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    // Prefer an administrator, then the oldest active user.
    const target =
        (await prisma.user.findFirst({
            where: { client_id: client.id, status: 'active', client_role: 'administrator' },
            orderBy: { created_at: 'asc' },
        })) ??
        (await prisma.user.findFirst({
            where: { client_id: client.id, status: 'active' },
            orderBy: { created_at: 'asc' },
        }));

    if (!target) {
        return back({ error: 'Client has no active users. Add a user first.' });
    }

    // Log in as the target on the web guard; the admin session stays intact so
    // the impersonation can be stopped.
    await writeSession({
        uid: Number(target.id),
        client_id: Number(client.id),
        current_tenant_id: target.tenant_id ? Number(target.tenant_id) : null,
        locale: target.locale ?? null,
        theme: target.theme ?? 'light',
        impersonating: true,
        impersonated_client_id: Number(client.id),
        impersonator_admin_id: Number(gate.admin.id),
    });

    await logAdminAudit(gate.admin, 'client.impersonated', 'Client', client.id, {
        user_id: Number(target.id),
    });

    return redirectTo('/app/dashboard', { success: `Impersonating ${client.name}.` });
});
