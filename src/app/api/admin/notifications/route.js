import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate, validationError } from '@/lib/http';

/** POST /admin/notifications */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.notifications.store', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        title: ['required', 'string', 'max:255'],
        message: ['required', 'string', 'max:5000'],
        level: ['required', 'in:info,success,warning,critical'],
        client_id: ['nullable', 'integer'],
    });

    // A null client_id broadcasts to every customer.
    if (data.client_id) {
        const client = await prisma.client.findUnique({ where: { id: BigInt(data.client_id) } });
        if (!client) return validationError({ client_id: ['The selected client id is invalid.'] });
    }

    await prisma.notification.create({
        data: {
            client_id: data.client_id ? BigInt(data.client_id) : null,
            title: data.title,
            message: data.message,
            level: data.level,
            created_by_admin_id: gate.admin.id,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Notification sent.' });
});
