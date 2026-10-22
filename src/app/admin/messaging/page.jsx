import AdminMessaging from '@/views/Admin/Messaging/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { iso } from '@/lib/serialize';
import { messagingSettings } from '@/lib/services/messaging';

export const dynamic = 'force-dynamic';

/** GET /admin/messaging */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_settings');
    const params = await searchParams;

    const s = await messagingSettings();

    const where = {};
    if (params?.channel) where.channel = String(params.channel);
    if (params?.status) where.status = String(params.status);

    const logRows = await prisma.message.findMany({
        where,
        include: { clients: { select: { id: true, name: true } } },
        orderBy: { id: 'desc' },
        take: 50,
    });

    const [total, emails, whatsapp, sent] = await Promise.all([
        prisma.message.count(),
        prisma.message.count({ where: { channel: 'email' } }),
        prisma.message.count({ where: { channel: 'whatsapp' } }),
        prisma.message.count({ where: { status: { in: ['sent', 'delivered', 'read'] } } }),
    ]);

    const props = {
        settings: {
            provider_mode: s.provider_mode,
            meta_app_id: s.meta_app_id,
            meta_config_id: s.meta_config_id,
            verify_token: s.verify_token,
            embedded_signup_enabled: s.embedded_signup_enabled,
            coexistence_enabled: s.coexistence_enabled,
            webhook_url: `${String(config.app.url).replace(/\/+$/, '')}/webhooks/whatsapp/meta`,
        },
        logs: logRows.map((m) => ({
            id: Number(m.id),
            customer: m.clients?.name ?? null,
            channel: m.channel,
            direction: m.direction,
            status: m.status,
            created_at: iso(m.created_at),
        })),
        filters: {
            ...(params?.channel ? { channel: String(params.channel) } : {}),
            ...(params?.status ? { status: String(params.status) } : {}),
        },
        stats: {
            total,
            emails,
            whatsapp,
            success_rate: total ? Math.round((sent / total) * 1000) / 10 : 0,
        },
    };

    return renderPage(AdminMessaging, 'Admin/Messaging/Index', props, {
        url: '/admin/messaging',
        isAdminRoute: true,
    });
}
