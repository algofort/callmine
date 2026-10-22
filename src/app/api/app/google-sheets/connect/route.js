import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { firstOrCreateSheetConnection } from '@/lib/domain/google-sheets';
import { randomToken } from '@/lib/domain/widget';

/**
 * POST /app/google-sheets/connect.
 * The handshake is simulated locally; wire in real Google OAuth credentials to
 * connect a live account.
 */
export const POST = handler(async () => {
    const gate = await gateClient({ routeName: 'client.google-sheets.connect' });
    if (gate.response) return gate.response;

    const config = await firstOrCreateSheetConnection(gate.clientId);
    const spreadsheetId = `sim_${randomToken(10)}`;

    await prisma.googleSheetConnection.update({
        where: { id: config.id },
        data: {
            connected: true,
            account_email: gate.user.email,
            spreadsheet_id: spreadsheetId,
            spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
            last_synced_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Google Sheets connected.' });
});
