import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { abort } from '@/lib/http';
import {
    dispatchDue,
    grantMonthlyCredits,
    reapStuckCalls,
    syncSubscriptions,
} from '@/lib/services/dialer';

/**
 * Internal scheduler endpoints. The background worker (or any cron) POSTs these
 * once a minute; nothing dials until something does.
 * `scripts/worker.mjs` (or any external cron) calls these; the app itself runs
 * the work so the services resolve their `@/…` imports normally.
 *
 * Guarded by CRON_SECRET, or by AUTH_SECRET when that is not set.
 */

const TASKS = {
    // calling:dispatch — every minute
    dispatch: { ttl: 300, run: () => dispatchDue() },
    // calling:reap-stuck — every five minutes
    'reap-stuck': { ttl: 600, run: () => reapStuckCalls(30) },
    // credits:grant-monthly — daily 02:00
    'grant-monthly': { ttl: 3600, run: () => grantMonthlyCredits() },
    // billing:sync-subscriptions — daily 03:00
    'sync-subscriptions': { ttl: 3600, run: () => syncSubscriptions() },
    // scheduler heartbeat — proves cron is wired up on this server
    heartbeat: { ttl: 0, run: async () => 1 },
};

function secret() {
    return process.env.CRON_SECRET || process.env.AUTH_SECRET || '';
}

function authorized(request) {
    const expected = secret();
    if (!expected) return false;

    const presented = request.headers.get('x-cron-secret') ?? '';
    const a = Buffer.from(expected);
    const b = Buffer.from(presented);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/** withoutOverlapping() — a TTL lock row in the `cache` table. */
async function withLock(name, ttlSeconds, fn) {
    if (ttlSeconds <= 0) return fn();

    const key = `cron-lock:${name}`;
    const now = Math.floor(Date.now() / 1000);

    const existing = await prisma.cache.findUnique({ where: { key } }).catch(() => null);
    if (existing && Number(existing.expiration) > now) return null;

    await prisma.cache
        .upsert({
            where: { key },
            create: { key, value: '1', expiration: now + ttlSeconds },
            update: { value: '1', expiration: now + ttlSeconds },
        })
        .catch(() => {});

    try {
        return await fn();
    } finally {
        await prisma.cache.deleteMany({ where: { key } }).catch(() => {});
    }
}

async function heartbeat() {
    const now = Math.floor(Date.now() / 1000);
    await prisma.cache
        .upsert({
            where: { key: 'scheduler_last_run' },
            create: { key: 'scheduler_last_run', value: String(now), expiration: now + 3600 },
            update: { value: String(now), expiration: now + 3600 },
        })
        .catch(() => {});
}

export const POST = handler(async (request, { params }) => {
    if (!authorized(request)) return abort(401);

    const { task } = await params;
    const entry = TASKS[task];
    if (!entry) return abort(404, `Unknown task: ${task}`);

    // Every tick stamps the heartbeat the admin System page reads.
    await heartbeat();

    const result = await withLock(task, entry.ttl, entry.run);

    return NextResponse.json({
        task,
        skipped: result === null,
        result: result === null ? null : Number(result ?? 0),
    });
});
