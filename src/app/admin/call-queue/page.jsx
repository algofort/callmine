import AdminCallQueue from '@/views/Admin/CallQueue/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';
import { maskPhone } from '@/lib/domain/contacts';

export const dynamic = 'force-dynamic';

/** GET /admin/call-queue */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_settings');
    const params = await searchParams;

    const where = {};
    if (params?.status) where.status = String(params.status);

    const jobs = await paginate(prisma.callQueueJob, {
        where,
        orderBy: { id: 'desc' },
        include: {
            campaigns: { select: { id: true, name: true } },
            clients: { select: { id: true, name: true } },
            contacts: { select: { id: true, phone: true } },
        },
        perPage: 30,
        page: params?.page ?? 1,
        path: '/admin/call-queue',
        query: { status: params?.status },
        transform: (j) => ({
            id: Number(j.id),
            campaign: j.campaigns?.name ?? null,
            customer: j.clients?.name ?? null,
            contact: maskPhone(j.contacts?.phone),
            status: j.status,
            attempts: j.attempts,
            max_retries: j.max_retries,
            scheduled_for: iso(j.scheduled_for),
            last_error: j.last_error,
            created_at: iso(j.created_at),
        }),
    });

    const grouped = await prisma.callQueueJob.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

    const props = {
        jobs,
        filters: params?.status ? { status: String(params.status) } : {},
        stats: {
            pending: counts.pending ?? 0,
            scheduled: counts.scheduled ?? 0,
            processing: counts.processing ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
        },
    };

    return renderPage(AdminCallQueue, 'Admin/CallQueue/Index', props, {
        url: '/admin/call-queue',
        isAdminRoute: true,
    });
}
