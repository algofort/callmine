import 'server-only';

import config from '@/lib/config';
import { integrationConfig, integrationEnabled } from '@/lib/services/integrations';

/** Port of App\Services\Telephony\PlivoService. */

export const name = 'Plivo';

async function cfg(key, fallback = null) {
    const db = await integrationConfig('plivo');
    return db[key] ?? config.telephony.plivo[key] ?? fallback;
}

export async function isConfigured() {
    const id = await cfg('auth_id');
    const token = await cfg('auth_token');
    return !!id && !!token && (await integrationEnabled('plivo', config.telephony.plivo.enabled));
}

async function accountUrl(path) {
    const base = String(await cfg('api_base', 'https://api.plivo.com')).replace(/\/+$/, '');
    const authId = await cfg('auth_id');
    return `${base}/v1/Account/${authId}/${path}`;
}

async function call(path, { method = 'GET', query = null, json = null } = {}) {
    let url = await accountUrl(path);
    if (query) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) if (v !== null && v !== undefined && v !== '') qs.set(k, String(v));
        const s = qs.toString();
        if (s) url += `?${s}`;
    }

    const auth = Buffer.from(`${await cfg('auth_id')}:${await cfg('auth_token')}`).toString('base64');

    return fetch(url, {
        method,
        headers: {
            Authorization: `Basic ${auth}`,
            ...(json ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(json ? { body: JSON.stringify(json) } : {}),
        signal: AbortSignal.timeout(20000),
    });
}

export async function searchAvailableNumbers(country, areaCode, type) {
    if (!(await isConfigured())) return { error: 'Plivo is not configured.', numbers: [] };

    const query = {
        country_iso: String(country).toUpperCase(),
        type: ['local', 'toll_free', 'mobile'].includes(type) ? type.replace('_', '') : 'local',
        pattern: areaCode || null,
        limit: 20,
    };

    try {
        const res = await call('PhoneNumber/', { query });
        if (!res.ok) return { error: `Plivo error: HTTP ${res.status}`, numbers: [] };

        const json = await res.json();
        const numbers = (json.objects ?? [])
            .map((n) => ({
                e164: n.number ? `+${String(n.number).replace(/^\+/, '')}` : null,
                friendly: n.number ?? null,
                locality: n.region ?? null,
                region: n.region ?? null,
                country: n.country ?? country,
                capabilities: { voice: n.voice_enabled ?? true },
            }))
            .filter((n) => n.e164);

        return { numbers };
    } catch (e) {
        console.warn('[plivo] number search failed:', e?.message);
        return { error: e?.message, numbers: [] };
    }
}

export async function buyNumber(e164) {
    if (!(await isConfigured())) return { ok: false, error: 'Plivo is not configured.' };

    const number = String(e164).replace(/^\+/, '');
    try {
        const res = await call(`PhoneNumber/${number}/`, { method: 'POST' });
        if (!res.ok) return { ok: false, error: `Plivo error: HTTP ${res.status}` };

        const json = await res.json().catch(() => ({}));
        return { ok: true, sid: json?.numbers?.[0]?.number ?? number, e164 };
    } catch (e) {
        console.warn('[plivo] number purchase failed:', e?.message);
        return { ok: false, error: e?.message };
    }
}

export async function findOwnedNumber(e164) {
    if (!(await isConfigured())) return null;

    const number = String(e164).replace(/^\+/, '');
    try {
        const res = await call(`Number/${number}/`);
        if (!res.ok) return null;
        return { sid: e164, e164 };
    } catch (e) {
        console.warn('[plivo] owned-number lookup failed:', e?.message);
        return null;
    }
}

export async function releaseNumber(sid) {
    if (!sid || !(await isConfigured())) return false;

    const number = String(sid).replace(/^\+/, '');
    try {
        const res = await call(`Number/${number}/`, { method: 'DELETE' });
        return res.ok;
    } catch (e) {
        console.warn('[plivo] number release failed:', e?.message);
        return false;
    }
}

export async function placeCall(to, from, voiceUrl, statusCallbackUrl) {
    if (!(await isConfigured())) return { ok: false, error: 'Plivo is not configured.' };

    try {
        const res = await call('Call/', {
            method: 'POST',
            json: {
                from: String(from).replace(/^\+/, ''),
                to: String(to).replace(/^\+/, ''),
                answer_url: voiceUrl,
                answer_method: 'POST',
                hangup_url: statusCallbackUrl,
                hangup_method: 'POST',
            },
        });

        if (!res.ok) return { ok: false, error: `Plivo error: HTTP ${res.status}` };

        const json = await res.json();
        return { ok: true, sid: json.request_uuid };
    } catch (e) {
        console.warn('[plivo] place call failed:', e?.message);
        return { ok: false, error: e?.message };
    }
}

/** Plivo has no equivalent recording list/proxy; the UI treats these as no-ops. */
export async function listRecordings() {
    return {};
}

export async function fetchRecording() {
    return null;
}

export async function hangupCall(callUuid) {
    if (!callUuid || !(await isConfigured())) return false;
    try {
        const res = await call(`Call/${callUuid}/`, { method: 'DELETE' });
        return res.ok;
    } catch {
        return false;
    }
}

export async function authToken() {
    return cfg('auth_token');
}
