import prisma from '@/lib/prisma';
import { handler, resolveClientId } from '@/lib/guards';
import { abort } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { dateTimeString } from '@/lib/serialize';

/** GET /app/calls/export (streamed CSV). */
export const GET = handler(async () => {
    const user = await currentUser();
    if (!user) return abort(401);
    const clientId = await resolveClientId(user);
    if (!clientId) return abort(403);

    const filename = `calls-${new Date().toISOString().slice(0, 10)}.csv`;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
                encoder.encode(
                    csvRow([
                        'Date', 'Campaign', 'Agent', 'Contact', 'Status',
                        'Duration (s)', 'Sentiment', 'Qualification', 'Summary',
                    ]),
                ),
            );

            // chunk(500) — keeps memory flat on large accounts.
            let cursor = null;
            for (;;) {
                const batch = await prisma.call.findMany({
                    where: { client_id: BigInt(clientId), ...(cursor ? { id: { lt: cursor } } : {}) },
                    include: {
                        campaigns: { select: { name: true } },
                        agents: { select: { name: true } },
                        contacts: { select: { name: true } },
                    },
                    orderBy: { id: 'desc' },
                    take: 500,
                });
                if (!batch.length) break;

                for (const c of batch) {
                    controller.enqueue(
                        encoder.encode(
                            csvRow([
                                dateTimeString(c.created_at),
                                c.campaigns?.name ?? '',
                                c.agents?.name ?? '',
                                c.contacts?.name ?? '',
                                c.status,
                                c.duration_seconds,
                                c.sentiment ?? '',
                                c.qualification ?? '',
                                String(c.summary ?? '').replace(/[\r\n]/g, ' '),
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
            'Content-Type': 'text/csv',
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
