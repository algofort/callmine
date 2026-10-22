import 'server-only';

import prisma from '@/lib/prisma';

/** Port of App\Services\Calling\CallQueueService. */

export const QUEUE_STATUS = {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
};

/**
 * Claim up to `limit` due jobs, marking them processing inside a transaction so
 * two workers can never grab the same row.
 */
export async function claimDue(limit) {
    if (limit < 1) return [];

    const ids = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
            SELECT j.id
            FROM call_queue_jobs j
            LEFT JOIN campaigns c ON c.id = j.campaign_id
            WHERE j.status IN ('pending', 'scheduled')
              AND (j.scheduled_for IS NULL OR j.scheduled_for <= NOW())
              AND (c.id IS NULL OR c.status <> 'paused')
            ORDER BY j.priority DESC, j.scheduled_for ASC
            LIMIT ${limit}
            FOR UPDATE`;

        const claimed = rows.map((r) => BigInt(r.id));
        if (!claimed.length) return [];

        await tx.callQueueJob.updateMany({
            where: { id: { in: claimed } },
            data: { status: QUEUE_STATUS.PROCESSING, locked_at: new Date(), updated_at: new Date() },
        });

        return claimed;
    });

    if (!ids.length) return [];

    return prisma.callQueueJob.findMany({
        where: { id: { in: ids } },
        include: { campaigns: true, agents: true, contacts: true, phone_numbers: true },
    });
}

export async function markCompleted(job) {
    await prisma.callQueueJob.update({
        where: { id: job.id },
        data: { status: QUEUE_STATUS.COMPLETED, locked_at: null, updated_at: new Date() },
    });
}

/** Reschedule while retries remain, otherwise fail the job. */
export async function failOrRetry(job, error = null) {
    const attempts = Number(job.attempts ?? 0) + 1;

    const campaign = job.campaigns
        ? job.campaigns
        : job.campaign_id
          ? await prisma.campaign.findUnique({ where: { id: job.campaign_id } })
          : null;

    const delayMinutes = Number(campaign?.retry_delay_minutes ?? 60);

    if (Number(job.attempts ?? 0) < Number(job.max_retries ?? 0)) {
        await prisma.callQueueJob.update({
            where: { id: job.id },
            data: {
                status: QUEUE_STATUS.SCHEDULED,
                attempts,
                scheduled_for: new Date(Date.now() + delayMinutes * 60000),
                last_error: error,
                locked_at: null,
                updated_at: new Date(),
            },
        });
        return true;
    }

    await prisma.callQueueJob.update({
        where: { id: job.id },
        data: {
            status: QUEUE_STATUS.FAILED,
            attempts,
            last_error: error,
            locked_at: null,
            updated_at: new Date(),
        },
    });
    return false;
}

export async function release(job) {
    await prisma.callQueueJob.update({
        where: { id: job.id },
        data: { status: QUEUE_STATUS.PENDING, locked_at: null, updated_at: new Date() },
    });
}
