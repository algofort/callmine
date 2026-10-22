import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { firstOrCreateSheetConnection } from '@/lib/domain/google-sheets';

/** PUT /app/google-sheets */
export const PUT = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.google-sheets.update' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        sync_forms: ['nullable', 'boolean'],
        sync_appointments: ['nullable', 'boolean'],
    });

    const config = await firstOrCreateSheetConnection(gate.clientId);

    await prisma.googleSheetConnection.update({
        where: { id: config.id },
        data: {
            sync_forms: data.sync_forms ?? config.sync_forms,
            sync_appointments: data.sync_appointments ?? config.sync_appointments,
            updated_at: new Date(),
        },
    });

    return back({ success: 'Sync settings updated.' });
});
