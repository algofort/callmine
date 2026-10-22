import config from '@/lib/config';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';
import { putIntegration } from '@/lib/services/integrations';

/** PUT /admin/engines/{engine}/toggle */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.engines.toggle', 'manage_settings');
    if (gate.response) return gate.response;

    const { engine } = await params;
    if (!config.calling.engines[engine]) return abort(404);

    const data = await validate(await readBody(request), { enabled: ['required', 'boolean'] });

    await putIntegration(`engine:${engine}`, null, !!data.enabled);

    return back({ success: 'Engine updated.' });
});
