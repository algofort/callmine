import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, validate } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { iso } from '@/lib/serialize';
import { logAdminAudit } from '@/lib/services/audit-log';
import { applyTeamRole } from '@/lib/domain/client-users';

/** POST /admin/clients/{client}/users */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.users.store', 'update_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    const data = await validate(
        await readBody(request),
        {
            name: ['required', 'string', 'max:255'],
            email: ['required', 'email', 'max:255', 'unique:users,email'],
            password: ['required', 'string', 'min:8', 'confirmed'],
            client_role: ['required', 'string', 'in:administrator,staff'],
            role_id: ['nullable', 'integer'],
            status: ['required', 'string', 'in:active,inactive'],
        },
        { prisma },
    );

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: String(data.email).toLowerCase(),
            password: await hashPassword(data.password),
            role: 'client',
            client_id: client.id,
            client_role: data.client_role,
            status: data.status,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // A staff member with no team role would hold no permissions at all, so
    // always attach one — the chosen role, or the least-privileged system role.
    const roleId = await applyTeamRole(user, client.id, data.client_role, data.role_id);

    await logAdminAudit(gate.admin, 'client.user_created', 'User', user.id, {
        client_id: Number(client.id),
        email: user.email,
    });

    return NextResponse.json(
        {
            user: {
                id: Number(user.id),
                name: user.name,
                email: user.email,
                client_role: user.client_role,
                role_id: roleId,
                status: user.status,
                created_at: iso(user.created_at),
            },
        },
        { status: 201 },
    );
});
