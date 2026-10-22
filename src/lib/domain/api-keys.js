import 'server-only';

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

/** Port of App\Models\ApiKey. */

export const SCOPES = [
    'calls:read', 'calls:write', 'campaigns:read', 'campaigns:write',
    'agents:read', 'agents:write', 'contacts:read', 'contacts:write',
    'credits:read', 'analytics:read', 'webhooks:read', 'webhooks:write', 'admin',
];

/** Key alphabet — unambiguous characters only. */
function randomString(length) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

/** — returns [model, plaintextKey]; the plaintext is shown once. */
export async function generateApiKey(clientId, name, scopes, opts = {}) {
    const prefix = `cmk_${randomString(8)}`;
    const secret = randomString(40);

    const model = await prisma.apiKey.create({
        data: {
            client_id: BigInt(clientId),
            name,
            prefix,
            key_hash: await bcrypt.hash(secret, 12),
            scopes: scopes.filter((s) => SCOPES.includes(s)),
            ip_whitelist: opts.ip_whitelist ?? null,
            rate_limit_per_min: opts.rate_limit_per_min ?? 100,
            expires_at: opts.expires_at ?? null,
            created_by: opts.created_by ? BigInt(opts.created_by) : null,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return [model, `${prefix}.${secret}`];
}

/** — resolve a `prefix.secret` bearer token. */
export async function findValidApiKey(plain) {
    if (!plain || !plain.includes('.')) return null;

    const [prefix, secret] = String(plain).split('.', 2);
    const key = await prisma.apiKey.findUnique({ where: { prefix } });
    if (!key) return null;
    if (key.revoked_at) return null;
    if (key.expires_at && new Date(key.expires_at) < new Date()) return null;
    if (!(await bcrypt.compare(secret, key.key_hash))) return null;

    return key;
}

export function isRevoked(key) {
    if (!key) return true;
    if (key.revoked_at) return true;
    if (key.expires_at && new Date(key.expires_at) < new Date()) return true;
    return false;
}

export function hasScope(key, scope) {
    const scopes = key?.scopes ?? [];
    return scopes.includes('admin') || scopes.includes(scope);
}
