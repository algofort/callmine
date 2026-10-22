import { notFound } from 'next/navigation';
import ReportingAnalytics from '@/views/client/Reporting/Analytics';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { advancedAnalyticsPayload, reportingPayload } from '@/lib/services/client-analytics';

export const dynamic = 'force-dynamic';

/** GET /app/reporting/analytics */
export default async function Page() {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const props = {
        ...(await reportingPayload(clientId)),
        ...(await advancedAnalyticsPayload(clientId)),
    };

    return renderPage(ReportingAnalytics, 'client/Reporting/Analytics', props, {
        url: '/app/reporting/analytics',
    });
}
