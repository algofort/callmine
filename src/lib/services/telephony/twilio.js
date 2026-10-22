import 'server-only';

import config from '@/lib/config';
import { integrationConfig, integrationEnabled } from '@/lib/services/integrations';

/**
 * Port of App\Services\Telephony\TwilioService — the REST API directly, no SDK.
 * Degrades to a "not configured" state when credentials are absent.
 */

const TYPE_PATHS = {
    local: 'Local',
    toll_free: 'TollFree',
    mobile: 'Mobile',
    international: 'Local',
};

export const name = 'Twilio';

/** Credential resolver: admin DB settings first, then config()/env. */
async function cfg(key, fallback = null) {
    const db = await integrationConfig('twilio');
    return db[key] ?? config.telephony.twilio[key] ?? fallback;
}

export async function isConfigured() {
    const sid = await cfg('account_sid');
    const token = await cfg('auth_token');
    return !!sid && !!token && (await integrationEnabled('twilio', config.telephony.twilio.enabled));
}

async function authHeader() {
    const sid = await cfg('account_sid');
    const token = await cfg('auth_token');
    return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

async function accountUrl(path) {
    const base = String(await cfg('api_base', 'https://api.twilio.com')).replace(/\/+$/, '');
    const sid = await cfg('account_sid');
    return `${base}/2010-04-01/Accounts/${sid}/${path}`;
}

async function call(path, { method = 'GET', query = null, form = null } = {}) {
    let url = await accountUrl(path);
    if (query) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) if (v !== null && v !== undefined) qs.set(k, String(v));
        url += `?${qs.toString()}`;
    }

    const init = {
        method,
        headers: { Authorization: await authHeader() },
        signal: AbortSignal.timeout(20000),
    };

    if (form) {
        const body = new URLSearchParams();
        for (const [k, v] of Object.entries(form)) {
            if (v === null || v === undefined) continue;
            if (Array.isArray(v)) v.forEach((item) => body.append(k, String(item)));
            else body.append(k, String(v));
        }
        init.body = body;
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    return fetch(url, init);
}

/**
 * Twilio always returns a JSON body with a `message` (and numeric `code`);
 * surfacing it turns an opaque "HTTP 400" into an actionable reason.
 */
async function errorFrom(res) {
    try {
        const json = await res.json();
        if (json?.message) return `Twilio: ${json.message}${json.code ? ` (code ${json.code})` : ''}`;
    } catch {
        /* non-JSON body */
    }
    return `Twilio error: HTTP ${res.status}`;
}

export async function searchAvailableNumbers(country, areaCode, type) {
    if (!(await isConfigured())) return { error: 'Twilio is not configured.', numbers: [] };

    const typePath = TYPE_PATHS[type] ?? 'Local';
    const query = { PageSize: 20 };
    if (areaCode) query.AreaCode = areaCode;

    try {
        const res = await call(`AvailablePhoneNumbers/${country}/${typePath}.json`, { query });
        if (!res.ok) return { error: await errorFrom(res), numbers: [] };

        const json = await res.json();
        const numbers = (json.available_phone_numbers ?? [])
            .map((n) => ({
                e164: n.phone_number ?? null,
                friendly: n.friendly_name ?? null,
                locality: n.locality ?? null,
                region: n.region ?? null,
                country: n.iso_country ?? country,
                capabilities: n.capabilities ?? [],
            }))
            .filter((n) => n.e164);

        return { numbers };
    } catch (e) {
        console.warn('[twilio] number search failed:', e?.message);
        return { error: e?.message, numbers: [] };
    }
}

export async function buyNumber(e164) {
    if (!(await isConfigured())) return { ok: false, error: 'Twilio is not configured.' };

    try {
        // Twilio rejects the purchase ("Url is not a valid URL") when VoiceUrl points
        // at a non-public address, so only attach a real https URL.
        const voiceUrl = String(config.telephony.twilio.inbound_voice_url ?? '');
        const params = { PhoneNumber: e164 };
        if (voiceUrl.startsWith('https://')) params.VoiceUrl = voiceUrl;

        const res = await call('IncomingPhoneNumbers.json', { method: 'POST', form: params });
        if (!res.ok) return { ok: false, error: await errorFrom(res) };

        const json = await res.json();
        return { ok: true, sid: json.sid, e164: json.phone_number ?? e164 };
    } catch (e) {
        console.warn('[twilio] number purchase failed:', e?.message);
        return { ok: false, error: e?.message };
    }
}

export async function findOwnedNumber(e164) {
    if (!(await isConfigured())) return null;

    try {
        const res = await call('IncomingPhoneNumbers.json', { query: { PhoneNumber: e164, PageSize: 1 } });
        if (!res.ok) return null;

        const json = await res.json();
        const match = (json.incoming_phone_numbers ?? [])[0];
        if (!match?.sid) return null;

        return { sid: match.sid, e164: match.phone_number ?? e164 };
    } catch (e) {
        console.warn('[twilio] owned-number lookup failed:', e?.message);
        return null;
    }
}

export async function releaseNumber(sid) {
    if (!sid || !(await isConfigured())) return false;
    try {
        const res = await call(`IncomingPhoneNumbers/${sid}.json`, { method: 'DELETE' });
        return res.ok;
    } catch (e) {
        console.warn('[twilio] number release failed:', e?.message);
        return false;
    }
}

/** Recent recordings keyed by Call SID. */
export async function listRecordings(pageSize = 50) {
    if (!(await isConfigured())) return {};

    try {
        const res = await call('Recordings.json', { query: { PageSize: pageSize } });
        if (!res.ok) return {};

        const json = await res.json();
        const base = String(await cfg('api_base', 'https://api.twilio.com')).replace(/\/+$/, '');

        const out = {};
        for (const rec of json.recordings ?? []) {
            if (rec.call_sid && rec.sid) {
                out[rec.call_sid] = { sid: rec.sid, url: `${base}${rec.uri}` };
            }
        }
        return out;
    } catch (e) {
        console.warn('[twilio] list recordings failed:', e?.message);
        return {};
    }
}

/**
 * Recording audio via server-side Basic auth — Twilio recording URLs are
 * protected, so the browser cannot play them directly.
 */
export async function fetchRecording(recordingSid) {
    if (!recordingSid || !(await isConfigured())) return null;

    try {
        const res = await call(`Recordings/${recordingSid}.mp3`);
        if (!res.ok) return null;

        return {
            body: Buffer.from(await res.arrayBuffer()),
            content_type: res.headers.get('content-type') || 'audio/mpeg',
        };
    } catch (e) {
        console.warn('[twilio] recording fetch failed:', e?.message);
        return null;
    }
}

export async function placeCall(to, from, voiceUrl, statusCallbackUrl) {
    if (!(await isConfigured())) return { ok: false, error: 'Twilio is not configured.' };

    try {
        const res = await call('Calls.json', {
            method: 'POST',
            form: {
                To: to,
                From: from,
                Url: voiceUrl,
                Method: 'POST',
                StatusCallback: statusCallbackUrl,
                StatusCallbackMethod: 'POST',
                StatusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                Record: 'true',
                RecordingStatusCallback: config.telephony.twilio.recording_callback_url ?? '',
            },
        });

        if (!res.ok) return { ok: false, error: await errorFrom(res) };

        const json = await res.json();
        return { ok: true, sid: json.sid };
    } catch (e) {
        console.warn('[twilio] place call failed:', e?.message);
        return { ok: false, error: e?.message };
    }
}

/** Hang up an in-progress call (used by the REST API and admin call monitor). */
export async function hangupCall(callSid) {
    if (!callSid || !(await isConfigured())) return false;
    try {
        const res = await call(`Calls/${callSid}.json`, { method: 'POST', form: { Status: 'completed' } });
        return res.ok;
    } catch {
        return false;
    }
}

export async function authToken() {
    return cfg('auth_token');
}
