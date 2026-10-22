import AdminSystem from '@/views/Admin/System/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * GET /admin/system — copy-paste commands for keeping the dialer alive.
 *
 * Calling only happens while something drives `/api/cron/*` — either the
 * bundled worker (`npm run worker`) held open by Supervisor, systemd or PM2, or
 * a per-minute cron. The commands below are generated against this install's
 * real paths so they can be pasted as-is.
 */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const appPath = process.cwd();
    const nodeBinary = process.execPath;

    const commands = {
        cron_scheduler: `* * * * * cd ${appPath} && ${nodeBinary} scripts/worker.mjs >> /dev/null 2>&1`,
        cron_worker: `curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" ${config.app.url}/api/cron/dispatch`,
        supervisor: [
            '[program:callmineai-worker]',
            'process_name=%(program_name)s_%(process_num)02d',
            `command=${nodeBinary} ${appPath}/scripts/worker.mjs`,
            'autostart=true',
            'autorestart=true',
            'numprocs=1',
            `directory=${appPath}`,
            `stdout_logfile=/var/log/callmineai-worker.log`,
            'redirect_stderr=true',
        ].join('\n'),
    };

    // The worker stamps this every tick; a stale value means cron is not wired up.
    const heartbeat = await prisma.cache
        .findUnique({ where: { key: 'scheduler_last_run' } })
        .catch(() => null);

    const lastRun = heartbeat ? Number(heartbeat.value) : null;
    const schedulerRunning = !!lastRun && Math.floor(Date.now() / 1000) - lastRun < 120;

    const [waitingJobs, failedJobs, queuePending, oldest] = await Promise.all([
        prisma.job.count().catch(() => 0),
        prisma.failedJob.count().catch(() => 0),
        prisma.callQueueJob.count({ where: { status: 'pending' } }),
        prisma.job.aggregate({ _min: { created_at: true } }).catch(() => ({ _min: {} })),
    ]);

    const oldestWaiting = oldest?._min?.created_at ? Number(oldest._min.created_at) : null;
    const workerStalled =
        waitingJobs > 0 && !!oldestWaiting && Math.floor(Date.now() / 1000) - oldestWaiting > 180;

    const props = {
        env: {
            node_binary: nodeBinary,
            node_version: process.version,
            app_path: appPath,
            worker_path: `${appPath}/scripts/worker.mjs`,
            app_url: config.app.url,
            queue_connection: 'database',
            config_cached: process.env.NODE_ENV === 'production',
        },
        commands,
        health: {
            scheduler_running: schedulerRunning,
            scheduler_last_run: lastRun,
            worker_stalled: workerStalled,
            jobs_waiting: waitingJobs,
            jobs_failed: failedJobs,
            queue_pending: queuePending,
        },
    };

    return renderPage(AdminSystem, 'Admin/System/Index', props, {
        url: '/admin/system',
        isAdminRoute: true,
    });
}
