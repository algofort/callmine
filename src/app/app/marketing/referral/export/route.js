import prisma from '@/lib/prisma';
import { handler, resolveClientId } from '@/lib/guards';
import { abort, queryParams } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { dateTimeString } from '@/lib/serialize';
import { referralWhere } from '@/lib/domain/marketing';

/** GET /app/marketing/referral/export — ::exportReferrals() (streamed CSV). */
export const GET = handler(async (request) => {
    const user = await currentUser();
    if (!user) return abort(401);

    const clientId = await resolveClientId(user);
    if (!clientId) return abort(403);

    const where = referralWhere(clientId, queryParams(request));

    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const filename = `referrals-${stamp.slice(0, 8)}-${stamp.slice(9)}.csv`;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
                encoder.encode(csvRow(['Code', 'Referrer Email', 'Referred Email', 'Status', 'Reward', 'Created'])),
            );

            let cursor = null;
            for (;;) {
                const batch = await prisma.marketingReferral.findMany({
                    where: { ...where, ...(cursor ? { id: { lt: cursor } } : {}) },
                    orderBy: { id: 'desc' },
                    take: 500,
                });
                if (!batch.length) break;

                for (const r of batch) {
                    controller.enqueue(
                        encoder.encode(
                            csvRow([
                                r.referral_code,
                                r.referrer_email,
                                r.referred_email,
                                r.status,
                                r.reward_amount,
                                dateTimeString(r.created_at),
                            ]),
                        ),
                    );
                }

                cursor = batch[batch.length - 1].id;
            }

            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/csv; charset=UTF-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
});

function csvRow(values) {
    return (
        values
            .map((v) => {
                const s = v === null || v === undefined ? '' : String(v);
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(',') + '\n'
    );
}
