import Privacy from '@/views/frontend/Privacy';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /privacy */
export default async function Page() {
    return renderPage(Privacy, 'frontend/Privacy', {}, { url: '/privacy' });
}
