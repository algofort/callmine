import Blog from '@/views/frontend/Blog';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /blog */
export default async function Page() {
    return renderPage(Blog, 'frontend/Blog', {}, { url: '/blog' });
}
