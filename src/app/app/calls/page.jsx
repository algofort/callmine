import CallsIndex from '@/views/client/Calls/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { maskPhone } from '@/lib/domain/contacts';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/calls */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    const tab = params?.tab ? String(params.tab) : '';
    if (tab === 'transcribed') where.transcript = { not: null };
    else if (tab === 'recordings') where.recording_url = { not: null };

    if (params?.status) where.status = String(params.status);
    if (params?.sentiment) where.sentiment = String(params.sentiment);
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ transcript: { contains: s } }, { summary: { contains: s } }];
    }

    const calls = await paginate(prisma.call, {
        where,
        orderBy: { id: 'desc' },
        include: {
            campaigns: { select: { id: true, name: true } },
            agents: { select: { id: true, name: true } },
            contacts: { select: { id: true, name: true, phone: true } },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/calls',
        query: { tab: params?.tab, status: params?.status, sentiment: params?.sentiment, search: params?.search },
        transform: (c) => ({
            id: Number(c.id),
            campaign: c.campaigns?.name ?? null,
            agent: c.agents?.name ?? null,
            contact: c.contacts?.name ?? null,
            phone_masked: maskPhone(c.contacts?.phone),
            status: c.status,
            sentiment: c.sentiment,
            qualification: c.qualification,
            duration_seconds: c.duration_seconds,
            has_recording: !!c.recording_url,
            has_transcript: !!c.transcript && String(c.transcript).trim() !== '',
            summary: c.summary,
            created_at: iso(c.created_at),
        }),
    });

    const avg = await prisma.call.aggregate({
        where: { client_id, status: 'completed' },
        _avg: { duration_seconds: true },
    });
    const avgSeconds = Math.round(Number(avg._avg.duration_seconds ?? 0));

    const [total, completed, qualified] = await Promise.all([
        prisma.call.count({ where: { client_id } }),
        prisma.call.count({ where: { client_id, status: 'completed' } }),
        prisma.call.count({ where: { client_id, qualification: { in: ['hot', 'warm'] } } }),
    ]);

    const props = {
        calls,
        filters: {
            ...(params?.tab ? { tab: String(params.tab) } : {}),
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.sentiment ? { sentiment: String(params.sentiment) } : {}),
            ...(params?.search ? { search: String(params.search) } : {}),
        },
        stats: [
            { label: 'Total calls', value: String(total), icon: 'phone-call', accent: 'brand' },
            { label: 'Completed', value: String(completed), icon: 'check', accent: 'signal' },
            { label: 'Qualified leads', value: String(qualified), icon: 'target', accent: 'warm' },
            {
                label: 'Avg duration',
                value: `${Math.floor(avgSeconds / 60)}:${String(avgSeconds % 60).padStart(2, '0')}`,
                icon: 'clock',
                accent: 'cold',
            },
        ],
    };

    return renderPage(CallsIndex, 'client/Calls/Index', props, { url: '/app/calls' });
}
