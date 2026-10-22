import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate } from '@/lib/http';
import { logAdminAudit } from '@/lib/services/audit-log';

/** POST /admin/clients (permission:create_clients). */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.clients.store', 'create_clients');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        email: ['nullable', 'email', 'max:255'],
        phone: ['nullable', 'string', 'max:64'],
        address: ['nullable', 'string'],
        status: ['nullable', 'string', 'in:active,inactive'],
        base_currency: ['nullable', 'string', 'max:10'],
        currency_symbol: ['nullable', 'string', 'max:16'],
        currency_position: ['nullable', 'string', 'in:before,after'],
    });

    const client = await prisma.client.create({
        data: {
            name: data.name,
            email: data.email ?? null,
            phone: data.phone ?? null,
            address: data.address ?? null,
            status: data.status ?? 'active',
            base_currency: data.base_currency ?? 'USD',
            currency_symbol: data.currency_symbol ?? '$',
            currency_position: data.currency_position ?? 'before',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await logAdminAudit(gate.admin, 'client.created', 'Client', client.id, {
        name: client.name,
    });

    return redirectTo('/admin/clients', { success: 'Client created.' });
});
