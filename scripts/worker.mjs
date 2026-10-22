/**
 * Background worker — the replacement for `php artisan schedule:run` plus the
 * queue worker.
 *
 *   npm run worker          (with `npm run dev`/`npm start` already running)
 *
 * It is a thin scheduler: the work itself runs inside the Next app via
 * /api/cron/{task}, so the services resolve their `@/…` imports normally and
 * one overlap lock covers every worker instance.
 *
 * Schedule (from routes/console.php):
 *   every minute      dispatch             dispatch due outbound calls
 *   every 5 minutes   reap-stuck           recover calls with no terminal webhook
 *   daily 02:00       grant-monthly        plan credits per active client
 *   daily 03:00       sync-subscriptions   reconcile gateway subscription status
 *
 * A hosted cron (Vercel Cron, systemd timer, crontab) can replace this entirely
 * by POSTing the same endpoints with the X-Cron-Secret header.
 */
import fs from 'node:fs';
import path from 'node:path';

// Minimal .env reader — the worker runs outside Next, so nothing loads it for us.
function loadEnv() {
    for (const file of ['.env.local', '.env']) {
        const full = path.join(process.cwd(), file);
        if (!fs.existsSync(full)) continue;

        for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
            const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (!match) continue;
            const [, key, rawValue] = match;
            if (process.env[key] !== undefined) continue;
            process.env[key] = rawValue.replace(/^["']|["']$/g, '');
        }
    }
}

loadEnv();

const BASE = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const SECRET = process.env.CRON_SECRET || process.env.AUTH_SECRET || '';
const MINUTE = 60_000;

if (!SECRET) {
    console.error('[worker] CRON_SECRET or AUTH_SECRET must be set.');
    process.exit(1);
}

async function run(task) {
    try {
        const res = await fetch(`${BASE}/api/cron/${task}`, {
            method: 'POST',
            headers: { 'X-Cron-Secret': SECRET },
            signal: AbortSignal.timeout(5 * MINUTE),
        });

        if (!res.ok) {
            console.error(`[worker] ${task} -> HTTP ${res.status}`);
            return;
        }

        const json = await res.json();
        if (json.skipped) return; // another worker holds the lock
        if (json.result) console.log(`[worker] ${task}: ${json.result}`);
    } catch (e) {
        console.error(`[worker] ${task} failed:`, e?.message);
    }
}

let lastReap = 0;
let lastGrantDay = '';
let lastSyncDay = '';

async function tick() {
    const now = new Date();

    await run('dispatch');

    if (Date.now() - lastReap >= 5 * MINUTE) {
        lastReap = Date.now();
        await run('reap-stuck');
    }

    const today = now.toISOString().slice(0, 10);

    if (now.getHours() === 2 && lastGrantDay !== today) {
        lastGrantDay = today;
        await run('grant-monthly');
    }

    if (now.getHours() === 3 && lastSyncDay !== today) {
        lastSyncDay = today;
        await run('sync-subscriptions');
    }
}

console.log(`[worker] started against ${BASE}; ticking every 60s`);

await tick();
const timer = setInterval(() => {
    tick().catch((e) => console.error('[worker] tick failed:', e?.message));
}, MINUTE);

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        console.log('[worker] shutting down');
        clearInterval(timer);
        process.exit(0);
    });
}
