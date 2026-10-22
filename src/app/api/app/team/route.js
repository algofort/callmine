import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { planFor } from '@/lib/plans';
import { assignRole } from '@/lib/services/client-rbac';
import { findOwnRole, requireTeamManage } from '@/lib/domain/team';

/** POST /app/team */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.team.store' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const client_id = BigInt(gate.clientId);
    const plan = await planFor(gate.clientId);
    const seats = Number(plan?.team_seats_limit ?? 1);

    if ((await prisma.user.count({ where: { client_id } })) >= seats) {
        return back({ error: 'Team seat limit reached for your plan.' });
    }

    const data = await validate(
        await readBody(request),
        {
            name: ['required', 'string', 'max:255'],
            email: ['required', 'email', 'max:255', 'unique:users,email'],
            password: ['required', 'string', 'min:8'],
            role_id: ['required', 'integer'],
            status: ['required', 'in:active,inactive'],
        },
        { prisma },
    );

    const role = await findOwnRole(data.role_id, gate.clientId);
    if (!role) return validationError({ role_id: ['The selected role id is invalid.'] });

    const member = await prisma.user.create({
        data: {
            name: data.name,
            email: String(data.email).toLowerCase(),
            password: await hashPassword(data.password),
            role: 'client',
            client_id,
            status: data.status,
            client_role: 'staff',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await assignRole(member.id, role.id);

    return back({ success: 'Team member added.' });
});
