import ConfirmPassword from '@/views/Auth/ConfirmPassword';
import { renderPage } from '@/lib/render';
import { requireUserPage } from '@/lib/guards';

export const dynamic = 'force-dynamic';

/** GET /confirm-password */
export default async function Page() {
    await requireUserPage();
    return renderPage(ConfirmPassword, 'Auth/ConfirmPassword', {}, { url: '/confirm-password' });
}
