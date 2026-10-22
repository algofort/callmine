import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';
import { REASON, balance, charge, grant } from '@/lib/services/credits';
import { logAdminAudit } from '@/lib/services/audit-log';

/** POST /admin/clients/{client}/credits */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.credits', 'update_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    const data = await validate(await readBody(request), {
        amount: ['required', 'integer', 'not_in:0'],
        note: ['nullable', 'string', 'max:255'],
    });

    const amount = Number(data.amount);
    const opts = { note: data.note ?? null, admin_id: gate.admin.id };

    if (amount > 0) await grant(client.id, amount, REASON.ADMIN_ADJUST, opts);
    else await charge(client.id, Math.abs(amount), REASON.ADMIN_ADJUST, opts);

    const newBalance = await balance(client.id);

    await logAdminAudit(gate.admin, 'client.credits_adjusted', 'Client', client.id, {
        amount,
        balance: newBalance,
    });

    return back({ success: `Credits updated. New balance: ${newBalance}` });
});
