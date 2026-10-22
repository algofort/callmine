import ProfileEdit from '@/views/Profile/Edit';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';

export const dynamic = 'force-dynamic';

/** GET /app/profile */
export default async function Page({ searchParams }) {
    await requireClientPage();
    const params = await searchParams;

    return renderPage(
        ProfileEdit,
        'Profile/Edit',
        { mustVerifyEmail: true, status: params?.status ?? null },
        { url: '/app/profile' },
    );
}
