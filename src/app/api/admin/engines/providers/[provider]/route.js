import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';
import { putIntegration } from '@/lib/services/integrations';
import { PROVIDER_FIELDS, PROVIDER_KIND, PROVIDER_LABEL } from '@/lib/domain/admin-engines';

/** PUT /admin/engines/providers/{provider} — ::updateProvider() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.engines.provider.update', 'manage_settings');
    if (gate.response) return gate.response;

    const { provider } = await params;
    if (!PROVIDER_KIND[provider]) return abort(404);

    const body = await readBody(request);
    const enabled = !!body.enabled;

    // ElevenLabs has no inline credentials — its keys live in the pool.
    if (provider === 'elevenlabs') {
        await putIntegration(provider, null, enabled);
        return back({ success: 'ElevenLabs updated.' });
    }

    const rules = { enabled: ['nullable', 'boolean'] };
    for (const field of Object.keys(PROVIDER_FIELDS[provider] ?? {})) {
        rules[field] = ['nullable', 'string', 'max:255'];
    }

    const data = await validate(body, rules);

    // Only non-empty fields are written, so a blank input keeps the stored secret.
    const credentials = {};
    for (const field of Object.keys(PROVIDER_FIELDS[provider] ?? {})) {
        if (data[field]) credentials[field] = data[field];
    }

    await putIntegration(provider, Object.keys(credentials).length ? credentials : null, enabled);

    return back({ success: `${PROVIDER_LABEL[provider]} settings saved.` });
});
