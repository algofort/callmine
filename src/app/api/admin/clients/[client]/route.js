import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, redirectTo, validate } from '@/lib/http';
import { logAdminAudit } from '@/lib/services/audit-log';

/** PUT /admin/clients/{client} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.update', 'update_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        email: ['nullable', 'email', 'max:255'],
        phone: ['nullable', 'string', 'max:64'],
        address: ['nullable', 'string'],
        status: ['required', 'string', 'in:active,inactive'],
        base_currency: ['nullable', 'string', 'max:10'],
        currency_symbol: ['nullable', 'string', 'max:16'],
        currency_position: ['nullable', 'string', 'in:before,after'],
    });

    await prisma.client.update({
        where: { id: client.id },
        data: {
            name: data.name,
            email: data.email ?? null,
            phone: data.phone ?? null,
            address: data.address ?? null,
            status: data.status,
            ...(data.base_currency ? { base_currency: data.base_currency } : {}),
            ...(data.currency_symbol ? { currency_symbol: data.currency_symbol } : {}),
            ...(data.currency_position ? { currency_position: data.currency_position } : {}),
            updated_at: new Date(),
        },
    });

    await logAdminAudit(gate.admin, 'client.updated', 'Client', client.id, {
        name: data.name,
    });

    return back({ success: 'Client updated.' });
});

/** DELETE /admin/clients/{client} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.destroy', 'delete_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    await prisma.client.delete({ where: { id: client.id } });
    await logAdminAudit(gate.admin, 'client.deleted', null, null, { name: client.name });

    return redirectTo('/admin/clients', { success: 'Client deleted.' });
});
