import 'server-only';

import crypto from 'node:crypto';

/**
 * APP_KEY — the single secret the application encrypts and signs with.
 *
 * It protects every credential stored in the database (Twilio, OpenAI,
 * ElevenLabs, SMTP, payment gateways, SIP secrets) and signs the bearer tokens
 * the in-call agent presents on its callbacks. It is REQUIRED on every install:
 * `npm run key:generate` writes one into .env, and `npm run db:seed` generates
 * one automatically when the variable is still empty.
 *
 * Nothing here ever falls back to an empty key — an empty HMAC key would make
 * every derived token trivially guessable.
 */

const MISSING =
    'APP_KEY is not set. Run `npm run key:generate` to write one into your .env, ' +
    'then restart the app. See Installation → Requirements in the documentation.';

/** A fresh key in `base64:` form. */
export function generateAppKey() {
    return `base64:${crypto.randomBytes(32).toString('base64')}`;
}

/** True when a usable APP_KEY is configured. */
export function hasAppKey() {
    return String(process.env.APP_KEY || '').trim() !== '';
}

/**
 * The raw 32-byte key. Throws an actionable error when APP_KEY is missing so the
 * failure names the fix instead of surfacing as a crypto error.
 */
export function appKeyBytes() {
    const raw = String(process.env.APP_KEY || '').trim();
    if (!raw) throw new Error(MISSING);

    const bytes = decodeKey(raw);

    if (bytes.length !== 32) {
        throw new Error(
            `APP_KEY must decode to 32 bytes (got ${bytes.length}). Run \`npm run key:generate\` for a valid key.`,
        );
    }
    return bytes;
}

/**
 * The key used for HMAC signing (agent bearer tokens, signed URLs). Prefers
 * APP_KEY and accepts AUTH_SECRET — itself mandatory — as a fallback so signing
 * still works on an install that has not generated a key yet. Throws when both
 * are empty rather than signing with an empty key.
 */
export function signingKeyBytes() {
    const raw = String(process.env.APP_KEY || process.env.AUTH_SECRET || '').trim();
    if (!raw) {
        throw new Error(
            'Neither APP_KEY nor AUTH_SECRET is set — refusing to sign with an empty key. ' +
                'Run `npm run key:generate` and set AUTH_SECRET in your .env.',
        );
    }
    return decodeKey(raw);
}

/**
 * Accepts the `base64:` form this app writes, a bare base64 string, or raw
 * bytes — decoding as base64 only when it round-trips, so a plain passphrase is
 * never silently mangled.
 */
function decodeKey(raw) {
    if (raw.startsWith('base64:')) return Buffer.from(raw.slice(7), 'base64');

    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length === 32 && decoded.toString('base64').replace(/=+$/, '') === raw.replace(/=+$/, '')) {
        return decoded;
    }
    return Buffer.from(raw, 'utf8');
}
