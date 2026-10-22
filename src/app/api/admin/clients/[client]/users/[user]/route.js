import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { iso } from '@/lib/serialize';
import { logAdminAudit } from '@/lib/services/audit-log';
import { applyTeamRole } from '@/lib/domain/client-users';

async function resolve(params) {
    const { client: clientId, user: userId } = await params;

    const client = await prisma.client.findUnique({ where: { id: BigInt(clientId) } });
    if (!client) return { error: abort(404) };

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user || String(user.client_id) !== String(client.id)) return { error: abort(404) };

    return { client, user };
}

/** PUT /admin/clients/{client}/users/{user} — ::updateUser() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.users.update', 'update_clients');
    if (gate.response) return gate.response;

    const { client, user, error } = await resolve(params);
    if (error) return error;

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email', 'max:255'],
        password: ['nullable', 'string', 'min:8', 'confirmed'],
        client_role: ['required', 'string', 'in:administrator,staff'],
        role_id: ['nullable', 'integer'],
        status: ['required', 'string', 'in:active,inactive'],
    });

    const email = String(data.email).toLowerCase();
    const clash = await prisma.user.findFirst({ where: { email, id: { not: user.id } } });
    if (clash) return validationError({ email: ['The email has already been taken.'] });

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            name: data.name,
            email,
            client_role: data.client_role,
            status: data.status,
            ...(data.password ? { password: await hashPassword(data.password) } : {}),
            updated_at: new Date(),
        },
    });

    // Keep the team role in step with the account-level role, so a user demoted
    // from administrator to staff lands on a real role instead of none.
    const roleId = await applyTeamRole(updated, client.id, data.client_role, data.role_id);

    await logAdminAudit(gate.admin, 'client.user_updated', 'User', user.id, {
        client_id: Number(client.id),
    });

    return NextResponse.json({
        user: {
            id: Number(updated.id),
            name: updated.name,
            email: updated.email,
            client_role: updated.client_role,
            role_id: roleId,
            status: updated.status,
            created_at: iso(updated.created_at),
        },
    });
});

/** DELETE /admin/clients/{client}/users/{user} — ::destroyUser() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.users.destroy', 'update_clients');
    if (gate.response) return gate.response;

    const { client, user, error } = await resolve(params);
    if (error) return error;

    // Never leave a customer without an administrator.
    const adminCount = await prisma.user.count({
        where: { client_id: client.id, client_role: 'administrator' },
    });
    if (user.client_role === 'administrator' && adminCount <= 1) {
        return NextResponse.json(
            { message: 'Cannot delete the last client administrator.' },
            { status: 422 },
        );
    }

    await prisma.user.delete({ where: { id: user.id } });

    await logAdminAudit(gate.admin, 'client.user_deleted', 'User', null, {
        client_id: Number(client.id),
        email: user.email,
    });

    return new NextResponse(null, { status: 204 });
});
