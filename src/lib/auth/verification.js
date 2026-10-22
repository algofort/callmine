import 'server-only';

import crypto from 'node:crypto';
import config from '@/lib/config';
import { signingKeyBytes } from '@/lib/app-key';

/**
 * Expiring signed URLs used for email
 * verification and the TTS audio endpoint. Same query params (`expires`,
 * `signature`) and the same HMAC-SHA256 over the full URL.
 */

const signingKey = signingKeyBytes;

export function sign(url) {
    return crypto.createHmac('sha256', signingKey()).update(url).digest('hex');
}

/** Build an absolute signed URL that expires `seconds` from now. */
export function signedUrl(path, params = {}, seconds = 3600) {
    const url = new URL(path, config.app.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set('expires', String(Math.floor(Date.now() / 1000) + seconds));

    const signature = sign(url.toString());
    url.searchParams.set('signature', signature);
    return url.toString();
}

/** Validate a signed request URL (`middleware('signed')`). */
export function hasValidSignature(requestUrl) {
    const url = new URL(requestUrl);
    const signature = url.searchParams.get('signature');
    if (!signature) return false;

    const expires = url.searchParams.get('expires');
    if (expires && Number(expires) * 1000 < Date.now()) return false;

    url.searchParams.delete('signature');
    const expected = sign(url.toString());

    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** `URL::temporarySignedRoute('verification.verify', 60min, [id, hash])` */
export async function verificationUrl(user) {
    const hash = crypto.createHash('sha1').update(String(user.email)).digest('hex');
    return signedUrl(`/verify-email/${Number(user.id)}/${hash}`, {}, 3600);
}

export function emailVerificationHash(email) {
    return crypto.createHash('sha1').update(String(email)).digest('hex');
}
