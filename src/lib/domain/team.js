import 'server-only';

import prisma from '@/lib/prisma';
import { abort } from '@/lib/http';
import { userCan } from '@/lib/auth';

/** Shared checks for Client\TeamController. */

/** `client.permission:team.manage` plus the "must have a client" guard. */
export async function requireTeamManage(gate) {
    if (!gate.clientId) return abort(404);
    if (!(await userCan(gate.user, 'team.manage'))) {
        return abort(403, 'You do not have permission to perform this action.');
    }
    return null;
}

/** Rule::exists('client_roles','id')->where('client_id', $clientId) */
export async function findOwnRole(roleId, clientId) {
    if (!roleId) return null;
    return prisma.clientRole.findFirst({
        where: { id: BigInt(roleId), client_id: BigInt(clientId) },
    });
}

/** A member must belong to the acting user's client. */
export async function findOwnMember(memberId, clientId) {
    return prisma.user.findFirst({
        where: { id: BigInt(memberId), client_id: BigInt(clientId) },
    });
}
