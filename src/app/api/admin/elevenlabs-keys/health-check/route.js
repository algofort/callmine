import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back } from '@/lib/http';
import { healthCheckAll } from '@/lib/services/elevenlabs';

/** POST /admin/elevenlabs-keys/health-check — ::healthCheck() */
export const POST = handler(async () => {
    const gate = await gateAdminPermissions('admin.elevenlabs-keys.health-check', 'manage_settings');
    if (gate.response) return gate.response;

    const result = await healthCheckAll();

    return back({ success: `${result.healthy} of ${result.checked} keys healthy.` });
});
