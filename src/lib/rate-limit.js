import 'server-only';

import prisma from '@/lib/prisma';

/**
 * Fixed-window rate limiter backed by the `cache` table so the
 * counters survive a process restart and work across Node instances.
 */

const PREFIX = 'ratelimit:';

async function readSlot(key) {
    try {
        const row = await prisma.cache.findUnique({ where: { key: PREFIX + key } });
        if (!row) return null;
        if (Number(row.expiration) * 1000 < Date.now()) return null;
        return { hits: parseInt(row.value, 10) || 0, expiration: Number(row.expiration) };
    } catch {
        return null;
    }
}

export async function tooManyAttempts(key, maxAttempts) {
    const slot = await readSlot(key);
    return !!slot && slot.hits >= maxAttempts;
}

export async function hit(key, decaySeconds = 60) {
    const now = Math.floor(Date.now() / 1000);
    const slot = await readSlot(key);
    const expiration = slot ? slot.expiration : now + decaySeconds;
    const hits = (slot?.hits ?? 0) + 1;

    try {
        await prisma.cache.upsert({
            where: { key: PREFIX + key },
            create: { key: PREFIX + key, value: String(hits), expiration },
            update: { value: String(hits), expiration },
        });
    } catch {
        /* a cache write failure must never block the request */
    }
    return hits;
}

export async function clear(key) {
    // deleteMany, not delete — a successful login with no prior failures has no
    // row, and delete() would throw (and log) on every clean sign-in.
    try {
        await prisma.cache.deleteMany({ where: { key: PREFIX + key } });
    } catch {
        /* a cache write failure must never block the request */
    }
}

export async function availableIn(key) {
    const slot = await readSlot(key);
    if (!slot) return 0;
    return Math.max(0, slot.expiration - Math.floor(Date.now() / 1000));
}

/** `Str::lower($email).'|'.$request->ip()` */
export function throttleKey(email, request) {
    const ip =
        request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
        request?.headers?.get?.('x-real-ip') ||
        '127.0.0.1';
    return `${String(email ?? '').toLowerCase()}|${ip}`;
}
