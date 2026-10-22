import AdminAuditLog from '@/views/Admin/AuditLog/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/audit-log */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_settings');
    const params = await searchParams;

    const where = {};
    if (params?.user_id) where.user_id = BigInt(params.user_id);
    if (params?.actor_admin_id) where.actor_admin_id = BigInt(params.actor_admin_id);
    if (params?.action) where.action = String(params.action);

    const logs = await paginate(prisma.auditLog, {
        where,
        orderBy: { created_at: 'desc' },
        include: {
            users: { select: { id: true, name: true, email: true } },
            admin_users: { select: { id: true, name: true, email: true } },
        },
        perPage: 30,
        page: params?.page ?? 1,
        path: '/admin/audit-log',
        query: { user_id: params?.user_id, actor_admin_id: params?.actor_admin_id, action: params?.action },
        transform: (log) => ({
            id: Number(log.id),
            user: log.users
                ? { id: Number(log.users.id), name: log.users.name, email: log.users.email }
                : null,
            actor_admin: log.admin_users
                ? { id: Number(log.admin_users.id), name: log.admin_users.name, email: log.admin_users.email }
                : null,
            action: log.action,
            meta: plain(log.meta),
            auditable_type: log.auditable_type,
            auditable_id: log.auditable_id ? Number(log.auditable_id) : null,
            old_values: plain(log.old_values),
            new_values: plain(log.new_values),
            ip: log.ip,
            url: log.url,
            created_at: iso(log.created_at),
        }),
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, today] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { created_at: { gte: startOfDay } } }),
    ]);

    const props = {
        logs,
        stats: [
            { label: 'Total Events', value: total, icon: 'list', accent: 'brand' },
            { label: 'Events Today', value: today, icon: 'activity', accent: 'signal' },
        ],
        filters: {
            ...(params?.user_id ? { user_id: String(params.user_id) } : {}),
            ...(params?.actor_admin_id ? { actor_admin_id: String(params.actor_admin_id) } : {}),
            ...(params?.action ? { action: String(params.action) } : {}),
        },
    };

    return renderPage(AdminAuditLog, 'Admin/AuditLog/Index', props, {
        url: '/admin/audit-log',
        isAdminRoute: true,
    });
}
