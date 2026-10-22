import CampaignWizard from '@/views/client/Campaigns/Wizard';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { wizardData } from '@/lib/domain/campaigns';
import { canCreate } from '@/lib/plans';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** GET /app/campaigns/create (plan.limit:campaigns). */
export default async function Page() {
    const { clientId } = await requireClientPage();
    if (!(await canCreate(clientId, 'campaigns'))) redirect('/app/campaigns');

    return renderPage(CampaignWizard, 'client/Campaigns/Wizard', await wizardData(clientId), {
        url: '/app/campaigns/create',
    });
}
