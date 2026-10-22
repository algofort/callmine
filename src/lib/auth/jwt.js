import { SignJWT, jwtVerify } from 'jose';

/**
 * Edge-safe JWT helpers. Kept free of `next/headers` and `server-only` so the
 * middleware (Edge runtime) can verify a session cookie too.
 */

export const USER_COOKIE = 'cm_session';
export const ADMIN_COOKIE = 'cm_admin';

const DAY = 60 * 60 * 24;
export const LIFETIME = DAY * 30;

function secret() {
    const value = process.env.AUTH_SECRET;
    if (!value || value.length < 32) {
        throw new Error('AUTH_SECRET must be set to at least 32 characters.');
    }
    return new TextEncoder().encode(value);
}

export async function signToken(payload, maxAge = LIFETIME) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${maxAge}s`)
        .sign(secret());
}

export async function verifyToken(token) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret());
        return payload;
    } catch {
        return null;
    }
}

export function cookieOptions(maxAge = LIFETIME) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
    };
}
