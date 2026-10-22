import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { assignRole } from '@/lib/services/client-rbac';
import { findOwnMember, findOwnRole, requireTeamManage } from '@/lib/domain/team';

/** PUT /app/team/{member} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.team.update' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const { member: id } = await params;
    const member = await findOwnMember(id, gate.clientId);
    if (!member) return abort(404);

    const body = await readBody(request);
    const data = await validate(body, {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email'],
        password: ['nullable', 'string', 'min:8'],
        role_id: ['required', 'integer'],
        status: ['required', 'in:active,inactive'],
    });

    // unique:users,email ignoring this member.
    const clash = await prisma.user.findFirst({
        where: { email: String(data.email).toLowerCase(), id: { not: member.id } },
    });
    if (clash) return validationError({ email: ['The email has already been taken.'] });

    const role = await findOwnRole(data.role_id, gate.clientId);
    if (!role) return validationError({ role_id: ['The selected role id is invalid.'] });

    await prisma.user.update({
        where: { id: member.id },
        data: {
            name: data.name,
            email: String(data.email).toLowerCase(),
            status: data.status,
            ...(data.password ? { password: await hashPassword(data.password) } : {}),
            updated_at: new Date(),
        },
    });

    await assignRole(member.id, role.id);

    return back({ success: 'Team member updated.' });
});

/** DELETE /app/team/{member} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.team.destroy' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const { member: id } = await params;
    const member = await findOwnMember(id, gate.clientId);
    if (!member) return abort(404);

    if (String(member.id) === String(gate.user.id)) {
        return back({ error: 'You cannot remove yourself.' });
    }

    await prisma.user.delete({ where: { id: member.id } });
    return back({ success: 'Team member removed.' });
});
