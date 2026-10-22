import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate, validationError } from '@/lib/http';
import { assignRole } from '@/lib/services/client-rbac';
import { findOwnMember, findOwnRole, requireTeamManage } from '@/lib/domain/team';

/** POST /app/team/{member}/role */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.team.assign-role' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const { member: id } = await params;
    const member = await findOwnMember(id, gate.clientId);
    if (!member) return abort(404);

    const data = await validate(await readBody(request), { role_id: ['required', 'integer'] });

    const role = await findOwnRole(data.role_id, gate.clientId);
    if (!role) return validationError({ role_id: ['The selected role id is invalid.'] });

    await assignRole(member.id, role.id);
    return back({ success: 'Role updated.' });
});
