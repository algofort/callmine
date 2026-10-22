import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate, validationError } from '@/lib/http';

/** POST /admin/phone-pool/{phoneNumber}/assign */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.phone-pool.assign', 'manage_settings');
    if (gate.response) return gate.response;

    const { phoneNumber: id } = await params;
    const number = await prisma.phoneNumber.findUnique({ where: { id: BigInt(id) } });
    if (!number) return abort(404);

    // Only an unassigned pool number can be handed to a customer.
    if (number.client_id !== null) return abort(422);

    const data = await validate(await readBody(request), { client_id: ['required', 'integer'] });

    const client = await prisma.client.findUnique({ where: { id: BigInt(data.client_id) } });
    if (!client) return validationError({ client_id: ['The selected client id is invalid.'] });

    await prisma.phoneNumber.update({
        where: { id: number.id },
        data: { client_id: client.id, updated_at: new Date() },
    });

    return back({ success: 'Number assigned to customer.' });
});
