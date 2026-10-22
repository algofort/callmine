import AdminEngines from '@/views/Admin/Engines/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { allEngines } from '@/lib/services/integrations';
import { elevenLabsSummary, summaryState } from '@/lib/domain/admin-engines';

export const dynamic = 'force-dynamic';

/** GET /admin/engines */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const props = {
        providers: [
            await summaryState('twilio'),
            await summaryState('plivo'),
            await summaryState('openai'),
            await summaryState('elevenlabs', await elevenLabsSummary()),
        ],
        engines: await allEngines(),
    };

    return renderPage(AdminEngines, 'Admin/Engines/Index', props, {
        url: '/admin/engines',
        isAdminRoute: true,
    });
}
