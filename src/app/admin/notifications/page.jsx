import AdminNotifications from '@/views/Admin/Notifications/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/notifications */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const rows = await prisma.notification.findMany({ orderBy: { id: 'desc' }, take: 50 });

    const [total, broadcasts] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { client_id: null } }),
    ]);

    const props = {
        notifications: rows.map((n) => ({
            id: Number(n.id),
            title: n.title,
            message: n.message,
            level: n.level,
            audience: n.client_id ? 'Single customer' : 'All customers',
            created_at: iso(n.created_at),
        })),
        stats: [
            { label: 'Total notifications', value: total, icon: 'bell', accent: 'brand' },
            { label: 'Broadcasts (all customers)', value: broadcasts, icon: 'megaphone', accent: 'signal' },
            { label: 'Targeted', value: total - broadcasts, icon: 'target', accent: 'cold' },
        ],
    };

    return renderPage(AdminNotifications, 'Admin/Notifications/Index', props, {
        url: '/admin/notifications',
        isAdminRoute: true,
    });
}
