import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { firstOrCreateSheetConnection } from '@/lib/domain/google-sheets';

/** POST /app/google-sheets/disconnect */
export const POST = handler(async () => {
    const gate = await gateClient({ routeName: 'client.google-sheets.disconnect' });
    if (gate.response) return gate.response;

    const config = await firstOrCreateSheetConnection(gate.clientId);

    await prisma.googleSheetConnection.update({
        where: { id: config.id },
        data: {
            connected: false,
            account_email: null,
            spreadsheet_id: null,
            spreadsheet_url: null,
            updated_at: new Date(),
        },
    });

    return back({ success: 'Google Sheets disconnected.' });
});
