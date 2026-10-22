import GoogleSheetsIndex from '@/views/client/GoogleSheets/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { diffForHumans, iso } from '@/lib/serialize';
import { firstOrCreateSheetConnection } from '@/lib/domain/google-sheets';

export const dynamic = 'force-dynamic';

/** GET /app/google-sheets */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const config = await firstOrCreateSheetConnection(clientId);

    const props = {
        config: {
            connected: config.connected,
            account_email: config.account_email,
            spreadsheet_id: config.spreadsheet_id,
            spreadsheet_url: config.spreadsheet_url,
            sync_forms: config.sync_forms,
            sync_appointments: config.sync_appointments,
            rows_synced: config.rows_synced,
            last_synced_at: iso(config.last_synced_at),
            last_synced_human: diffForHumans(config.last_synced_at),
        },
        stats: [
            {
                label: 'Status',
                value: config.connected ? 'Connected' : 'Not connected',
                icon: 'plug',
                accent: config.connected ? 'signal' : 'warm',
            },
            { label: 'Rows synced', value: String(config.rows_synced ?? 0), icon: 'list', accent: 'brand' },
            {
                label: 'Last sync',
                value: diffForHumans(config.last_synced_at) ?? 'Never',
                icon: 'clock',
                accent: 'cold',
            },
        ],
    };

    return renderPage(GoogleSheetsIndex, 'client/GoogleSheets/Index', props, {
        url: '/app/google-sheets',
    });
}
