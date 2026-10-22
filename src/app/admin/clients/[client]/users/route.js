import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { abort } from '@/lib/http';
import { iso } from '@/lib/serialize';
import { currentRoleId, teamRoleOptions } from '@/lib/domain/client-users';

/**
 * GET /admin/clients/{client}/users (JSON,
 * fetched by the clients page).
 */
export const GET = handler(async (request, { params }) => {
    await requireAdminPermissions('view_clients');

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    const users = await prisma.user.findMany({
        where: { client_id: client.id },
        orderBy: { created_at: 'asc' },
    });

    // The team roles the picker offers, plus the role each member holds today.
    const roles = await teamRoleOptions(client.id);
    const roleIds = await Promise.all(users.map((u) => currentRoleId(u.id)));

    return NextResponse.json({
        users: users.map((u, i) => ({
            id: Number(u.id),
            name: u.name,
            email: u.email,
            client_role: u.client_role ?? 'staff',
            role_id: roleIds[i],
            role_name: roles.find((r) => r.id === roleIds[i])?.name ?? null,
            status: u.status ?? 'active',
            created_at: iso(u.created_at),
        })),
        roles,
        client: { id: Number(client.id), name: client.name },
    });
});
