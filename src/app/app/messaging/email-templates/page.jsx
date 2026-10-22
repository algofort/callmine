import EmailTemplates from '@/views/client/Messaging/EmailTemplates';
import { renderPage } from '@/lib/render';
import { requireClientPage, requirePlanFeaturePage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/messaging/email-templates (plan.feature:messaging). */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    await requirePlanFeaturePage(user, 'messaging');

    const templates = await prisma.messageTemplate.findMany({
        where: { client_id: BigInt(clientId), channel: 'email' },
        orderBy: { id: 'desc' },
        select: { id: true, name: true, subject: true, is_active: true, updated_at: true },
    });

    return renderPage(EmailTemplates, 'client/Messaging/EmailTemplates', { templates: plain(templates) }, {
        url: '/app/messaging/email-templates',
    });
}
