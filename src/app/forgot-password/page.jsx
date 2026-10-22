import ForgotPassword from '@/views/Auth/ForgotPassword';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /forgot-password */
export default async function Page({ searchParams }) {
    const params = await searchParams;
    return renderPage(
        ForgotPassword,
        'Auth/ForgotPassword',
        { status: params?.status ?? null },
        { url: '/forgot-password' },
    );
}
