import 'server-only';

import crypto from 'node:crypto';
import config from '@/lib/config';
import { integrationConfig } from '@/lib/services/integrations';

/**
 * Port of App\Http\Middleware\VerifyTwilioSignature and VerifyPlivoSignature.
 * Both fail closed: with no auth token configured, the webhook is rejected.
 */

function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * The signed URL is rebuilt from the public APP_URL, which is
 * also the URL Twilio signed, so a proxy in front of Node cannot break it.
 */
export function fullUrl(request) {
    const incoming = new URL(request.url);
    const base = new URL(config.app.url);

    incoming.protocol = base.protocol;
    incoming.host = base.host;

    return incoming.toString();
}

/** Twilio: base64(HMAC-SHA1(url + sorted POST params, authToken)). */
export async function verifyTwilioSignature(request, params) {
    const stored = await integrationConfig('twilio');
    const token = String(stored.auth_token ?? config.telephony.twilio.auth_token ?? '');

    if (token === '') {
        console.warn('Twilio webhook rejected — no auth token configured.');
        return { ok: false, response: new Response('Twilio not configured', { status: 403 }) };
    }

    const signature = request.headers.get('x-twilio-signature') ?? '';
    if (signature === '') {
        return { ok: false, response: new Response('Invalid signature', { status: 403 }) };
    }

    let data = fullUrl(request);
    for (const key of Object.keys(params).sort()) {
        const value = params[key];
        data += key + (Array.isArray(value) ? value.join('') : String(value ?? ''));
    }

    const expected = crypto.createHmac('sha1', token).update(data).digest('base64');

    if (!timingSafeEqual(expected, signature)) {
        console.warn('Twilio webhook rejected — invalid signature.', { url: fullUrl(request) });
        return { ok: false, response: new Response('Invalid signature', { status: 403 }) };
    }

    return { ok: true };
}

/** Plivo V3: base64(HMAC-SHA256(url + nonce, authToken)); the header may list several. */
export async function verifyPlivoSignature(request) {
    const stored = await integrationConfig('plivo');
    const token = String(stored.auth_token ?? config.telephony.plivo.auth_token ?? '');

    if (token === '') {
        console.warn('Plivo webhook rejected — no auth token configured.');
        return { ok: false, response: new Response('Plivo not configured', { status: 403 }) };
    }

    const signatures = request.headers.get('x-plivo-signature-v3') ?? '';
    const nonce = request.headers.get('x-plivo-signature-v3-nonce') ?? '';

    if (signatures === '' || nonce === '') {
        return { ok: false, response: new Response('Invalid signature', { status: 403 }) };
    }

    const expected = crypto
        .createHmac('sha256', token)
        .update(fullUrl(request) + nonce)
        .digest('base64');

    for (const candidate of signatures.split(',')) {
        if (timingSafeEqual(expected, candidate.trim())) return { ok: true };
    }

    console.warn('Plivo webhook rejected — invalid signature.', { url: fullUrl(request) });
    return { ok: false, response: new Response('Invalid signature', { status: 403 }) };
}
