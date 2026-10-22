import Terms from '@/views/frontend/Terms';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /terms */
export default async function Page() {
    return renderPage(Terms, 'frontend/Terms', {}, { url: '/terms' });
}
