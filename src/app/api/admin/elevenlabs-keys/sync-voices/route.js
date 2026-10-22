import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back } from '@/lib/http';
import { syncVoices } from '@/lib/services/elevenlabs';

/** POST /admin/elevenlabs-keys/sync-voices — ::syncVoices() */
export const POST = handler(async () => {
    const gate = await gateAdminPermissions('admin.elevenlabs-keys.sync-voices', 'manage_settings');
    if (gate.response) return gate.response;

    const result = await syncVoices();

    if (result.synced === 0) {
        return back({ error: 'No voices synced — add an active key first.' });
    }

    return back({ success: `${result.synced} voices synced from key ${result.key ?? '—'}.` });
});
