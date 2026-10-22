import { redirect } from 'next/navigation';
import VerifyEmail from '@/views/Auth/VerifyEmail';
import { renderPage } from '@/lib/render';
import { requireUserPage } from '@/lib/guards';

export const dynamic = 'force-dynamic';

/** GET /verify-email */
export default async function Page({ searchParams }) {
    const user = await requireUserPage();
    if (user.email_verified_at) redirect('/app/dashboard');

    const params = await searchParams;
    return renderPage(
        VerifyEmail,
        'Auth/VerifyEmail',
        { status: params?.status ?? null },
        { url: '/verify-email' },
    );
}
