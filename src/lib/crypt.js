import 'server-only';

import crypto from 'node:crypto';
import { appKeyBytes } from '@/lib/app-key';

/**
 * Authenticated symmetric encryption (AES-256-CBC + HMAC-SHA256) for the
 * credentials the app stores in the database: SMTP passwords, payment-gateway
 * secrets, provider API keys and SIP secrets.
 *
 * Every value is keyed on APP_KEY, which is required on all installs — see
 * `src/lib/app-key.js`. Rotating APP_KEY makes previously stored credentials
 * unreadable, so re-enter them from the admin panel after a rotation.
 */

const key = appKeyBytes;

export function encryptString(plaintext) {
    const k = key();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', k, iv);

    // The plaintext is encrypted as-is; no serialization wrapper.
    const value = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]).toString('base64');
    const ivB64 = iv.toString('base64');
    const mac = crypto.createHmac('sha256', k).update(ivB64 + value).digest('hex');

    return Buffer.from(JSON.stringify({ iv: ivB64, value, mac, tag: '' })).toString('base64');
}

export function decryptString(payload) {
    if (!payload) return null;
    try {
        const k = key();
        const json = JSON.parse(Buffer.from(String(payload), 'base64').toString('utf8'));
        if (!json.iv || !json.value || !json.mac) return null;

        const expected = crypto.createHmac('sha256', k).update(json.iv + json.value).digest('hex');
        if (
            expected.length !== json.mac.length ||
            !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(json.mac))
        ) {
            return null;
        }

        const decipher = crypto.createDecipheriv('aes-256-cbc', k, Buffer.from(json.iv, 'base64'));
        return Buffer.concat([
            decipher.update(Buffer.from(json.value, 'base64')),
            decipher.final(),
        ]).toString('utf8');
    } catch {
        return null;
    }
}

/** Reads a value that may be plaintext (never encrypted) or an encrypted payload. */
export function maybeDecrypt(value) {
    if (!value) return null;
    const decrypted = decryptString(value);
    return decrypted ?? value;
}
