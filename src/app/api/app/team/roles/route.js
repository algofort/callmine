import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate } from '@/lib/http';
import { planFor } from '@/lib/plans';
import { randomKeySuffix, syncRolePermissions } from '@/lib/services/client-rbac';
import { requireTeamManage } from '@/lib/domain/team';

/** POST /app/team/roles (custom roles plan gate). */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.team.roles.store' });
    if (gate.response) return gate.response;

    const denied = await requireTeamManage(gate);
    if (denied) return denied;

    const plan = await planFor(gate.clientId);
    if (!plan?.custom_roles_enabled) return abort(403);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        permissions: ['nullable', 'array'],
    });

    const role = await prisma.clientRole.create({
        data: {
            client_id: BigInt(gate.clientId),
            key: `custom-${randomKeySuffix(8)}`,
            name: data.name,
            is_system: false,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await syncRolePermissions(role.id, data.permissions ?? []);

    return back({ success: 'Role created.' });
});
