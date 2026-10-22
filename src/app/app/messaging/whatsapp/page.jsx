import WhatsApp from '@/views/client/Messaging/WhatsApp';
import { renderPage } from '@/lib/render';
import { requireClientPage, requirePlanFeaturePage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { enabledWhatsAppProviders } from '@/lib/services/messaging';

export const dynamic = 'force-dynamic';

/** GET /app/messaging/whatsapp */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    await requirePlanFeaturePage(user, 'messaging');

    const client_id = BigInt(clientId);

    const [accounts, templates, enabledProviders] = await Promise.all([
        prisma.whatsAppAccount.findMany({
            where: { client_id },
            orderBy: { id: 'desc' },
            select: {
                id: true, provider: true, label: true, display_number: true,
                status: true, quality_rating: true, messaging_tier: true, verified: true,
            },
        }),
        prisma.whatsAppTemplate.findMany({
            where: { client_id },
            orderBy: { id: 'desc' },
            select: {
                id: true, name: true, language: true,
                category: true, status: true, whatsapp_account_id: true,
            },
        }),
        enabledWhatsAppProviders(),
    ]);

    return renderPage(
        WhatsApp,
        'client/Messaging/WhatsApp',
        { accounts: plain(accounts), templates: plain(templates), enabledProviders },
        { url: '/app/messaging/whatsapp' },
    );
}
