import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate } from '@/lib/http';
import { planFor } from '@/lib/plans';
import { syncRolePermissions } from '@/lib/services/client-rbac';
import { findOwnRole, requireTeamManage } from '@/lib/domain/team';

/** PUT /app/team/roles/{clientRole} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.team.roles.update' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const { clientRole: id } = await params;
    const role = await findOwnRole(id, gate.clientId);
    if (!role) return abort(404);

    // A system role's permissions stay editable; a custom role also needs the plan feature.
    const plan = await planFor(gate.clientId);
    if (!role.is_system && !plan?.custom_roles_enabled) return abort(403);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        permissions: ['nullable', 'array'],
    });

    // A system role keeps its name.
    if (!role.is_system) {
        await prisma.clientRole.update({
            where: { id: role.id },
            data: { name: data.name, updated_at: new Date() },
        });
    }

    await syncRolePermissions(role.id, data.permissions ?? []);

    return back({ success: 'Role updated.' });
});

/** DELETE /app/team/roles/{clientRole} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.team.roles.destroy' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const { clientRole: id } = await params;
    const role = await findOwnRole(id, gate.clientId);
    if (!role) return abort(404);

    if (role.is_system) return back({ error: 'System roles cannot be deleted.' });

    await prisma.clientRole.delete({ where: { id: role.id } });
    return back({ success: 'Role deleted.' });
});
