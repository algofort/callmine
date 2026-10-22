import Login from '@/views/Auth/Login';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /login */
export default async function Page({ searchParams }) {
    const params = await searchParams;
    return renderPage(
        Login,
        'Auth/Login',
        { canResetPassword: true, status: params?.status ?? null },
        { url: '/login' },
    );
}
