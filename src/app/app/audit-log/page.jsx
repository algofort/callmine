import { forbidden, notFound } from 'next/navigation';
import AuditLogIndex from '@/views/client/AuditLog/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/audit-log (client admins only). */
export default async function Page({ searchParams }) {
    const { user, clientId } = await requireClientPage();
    if (!clientId || user.client_role !== 'administrator') notFound();

    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    if (params?.user_id) where.user_id = BigInt(params.user_id);
    if (params?.action) where.action = { contains: String(params.action) };

    const logs = await paginate(prisma.auditLog, {
        where,
        orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, name: true, email: true } } },
        perPage: 30,
        page: params?.page ?? 1,
        path: '/app/audit-log',
        query: { user_id: params?.user_id, action: params?.action },
        transform: (log) => ({
            id: Number(log.id),
            user: log.users
                ? { id: Number(log.users.id), name: log.users.name, email: log.users.email }
                : null,
            action: log.action,
            meta: plain(log.meta),
            auditable_type: log.auditable_type,
            auditable_id: log.auditable_id ? Number(log.auditable_id) : null,
            ip: log.ip,
            url: log.url,
            created_at: iso(log.created_at),
        }),
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalEvents, eventsToday] = await Promise.all([
        prisma.auditLog.count({ where: { client_id } }),
        prisma.auditLog.count({ where: { client_id, created_at: { gte: startOfDay } } }),
    ]);

    const props = {
        logs,
        stats: [
            { label: 'Total events', value: totalEvents, icon: 'list', accent: 'brand' },
            { label: 'Events today', value: eventsToday, icon: 'clock', accent: 'signal' },
        ],
        filters: {
            ...(params?.user_id ? { user_id: String(params.user_id) } : {}),
            ...(params?.action ? { action: String(params.action) } : {}),
        },
    };

    return renderPage(AuditLogIndex, 'client/AuditLog/Index', props, { url: '/app/audit-log' });
}
