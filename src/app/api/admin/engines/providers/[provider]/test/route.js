import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back } from '@/lib/http';
import { driver } from '@/lib/services/telephony';
import { PROVIDER_LABEL, openAiTestCredentials } from '@/lib/domain/admin-engines';

/** POST /admin/engines/providers/{provider}/test — ::test() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.engines.provider.test', 'manage_settings');
    if (gate.response) return gate.response;

    const { provider } = await params;
    if (!['twilio', 'plivo', 'openai'].includes(provider)) return abort(404);

    if (provider === 'twilio' || provider === 'plivo') {
        const telephony = driver(provider);
        if (!(await telephony.isConfigured())) {
            return back({ error: `${PROVIDER_LABEL[provider]} has no credentials yet.` });
        }

        // A cheap read-only call proves the credentials work.
        const res = await telephony.searchAvailableNumbers('US', null, 'local');

        return res.error
            ? back({ error: `${PROVIDER_LABEL[provider]} connection failed: ${res.error}` })
            : back({ success: `${PROVIDER_LABEL[provider]} connected successfully.` });
    }

    const { key, model } = await openAiTestCredentials();
    if (!key) return back({ error: 'OpenAI has no API key yet.' });

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'Say OK.' }],
                max_tokens: 5,
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (res.ok) return back({ success: `OpenAI connected successfully (model ${model}).` });

        const json = await res.json().catch(() => ({}));
        return back({ error: `OpenAI failed: ${json?.error?.message ?? `HTTP ${res.status}`}` });
    } catch (e) {
        return back({ error: `OpenAI request failed: ${e?.message}` });
    }
});
