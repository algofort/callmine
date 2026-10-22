import Register from '@/views/Auth/Register';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /register */
export default async function Page() {
    return renderPage(Register, 'Auth/Register', {}, { url: '/register' });
}
