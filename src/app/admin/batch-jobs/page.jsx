import AdminBatchJobs from '@/views/Admin/BatchJobs/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/batch-jobs */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_settings');
    const params = await searchParams;

    const where = { deleted_at: null };
    if (params?.status) where.status = String(params.status);
    if (params?.client) where.client_id = BigInt(params.client);
    if (params?.search) where.name = { contains: String(params.search) };

    const batches = await paginate(prisma.campaign, {
        where,
        orderBy: { id: 'desc' },
        include: {
            clients: { select: { id: true, name: true } },
            _count: { select: { campaign_contact: true, calls: true } },
        },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/admin/batch-jobs',
        query: { status: params?.status, client: params?.client, search: params?.search },
        transform: (c) => c,
    });

    // Per-batch completed/failed counts (the controller's withCount aliases).
    for (const c of batches.data) {
        const [completed, failed] = await Promise.all([
            prisma.call.count({ where: { campaign_id: BigInt(c.id), status: 'completed' } }),
            prisma.call.count({
                where: { campaign_id: BigInt(c.id), status: { in: ['failed', 'no_answer', 'busy'] } },
            }),
        ]);

        const contacts = c._count.campaign_contact;
        const callsCount = c._count.calls;
        const total = Math.max(contacts, callsCount);
        const done = completed + failed;

        Object.assign(c, {
            id: Number(c.id),
            name: c.name,
            client: c.clients?.name ?? '—',
            status: c.status,
            contacts,
            calls: callsCount,
            completed,
            failed,
            progress: total > 0 ? Math.round((done / total) * 100) : 0,
            success_rate: callsCount > 0 ? Math.round((completed / callsCount) * 100) : 0,
            updated_at: iso(c.updated_at),
        });

        delete c.clients;
        delete c._count;
    }

    const base = { deleted_at: null };
    const [total, running, completedCount, callsDispatched, clients] = await Promise.all([
        prisma.campaign.count({ where: base }),
        prisma.campaign.count({ where: { ...base, status: 'active' } }),
        prisma.campaign.count({ where: { ...base, status: 'completed' } }),
        prisma.call.count(),
        prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);

    const props = {
        batches,
        filters: {
            ...(params?.status ? { status: String(params.status) } : {}),
            ...(params?.client ? { client: String(params.client) } : {}),
            ...(params?.search ? { search: String(params.search) } : {}),
        },
        clients: plain(clients),
        statuses: ['draft', 'active', 'paused', 'completed'],
        stats: [
            { label: 'Total batches', value: String(total), icon: 'list', accent: 'brand' },
            { label: 'Running', value: String(running), icon: 'activity', accent: 'signal' },
            { label: 'Completed', value: String(completedCount), icon: 'check', accent: 'cold' },
            { label: 'Calls dispatched', value: String(callsDispatched), icon: 'phone-call', accent: 'warm' },
        ],
    };

    return renderPage(AdminBatchJobs, 'Admin/BatchJobs/Index', props, {
        url: '/admin/batch-jobs',
        isAdminRoute: true,
    });
}
