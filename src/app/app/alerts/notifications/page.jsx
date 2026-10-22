import Notifications from '@/views/client/Notifications';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/alerts/notifications */
export default async function Page() {
    const { user, clientId } = await requireClientPage();

 // — this client's rows plus broadcasts.
    const rows = await prisma.notification.findMany({
        where: { OR: [{ client_id: clientId ? BigInt(clientId) : undefined }, { client_id: null }] },
        orderBy: { id: 'desc' },
        take: 50,
    });

    const notifications = rows.map((n) => ({
        id: Number(n.id),
        title: n.title,
        message: n.message,
        level: n.level,
        broadcast: n.client_id === null,
        created_at: iso(n.created_at),
    }));

    // saveQuietly() — mark read without bumping updated_at.
    await prisma.user.update({
        where: { id: user.id },
        data: { notifications_read_at: new Date() },
    });

    return renderPage(Notifications, 'client/Notifications', { notifications }, {
        url: '/app/alerts/notifications',
    });
}
