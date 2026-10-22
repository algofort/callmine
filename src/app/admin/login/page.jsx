import AdminLogin from '@/views/Admin/Auth/Login';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /admin/login */
export default async function Page({ searchParams }) {
    const params = await searchParams;
    return renderPage(
        AdminLogin,
        'Admin/Auth/Login',
        { status: params?.status ?? null, error: params?.error ?? null },
        { url: '/admin/login', isAdminRoute: false },
    );
}
