import ResetPassword from '@/views/Auth/ResetPassword';
import { renderPage } from '@/lib/render';

export const dynamic = 'force-dynamic';

/** GET /reset-password/{token} */
export default async function Page({ params, searchParams }) {
    const { token } = await params;
    const query = await searchParams;
    return renderPage(
        ResetPassword,
        'Auth/ResetPassword',
        { token, email: query?.email ?? '' },
        { url: `/reset-password/${token}` },
    );
}
