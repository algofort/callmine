import Faq from '@/views/frontend/Faq';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /faq */
export default async function Page() {
    return renderPage(Faq, 'frontend/Faq', {}, { url: '/faq' });
}
