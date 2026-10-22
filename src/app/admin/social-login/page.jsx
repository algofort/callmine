import AdminSocialLogin from '@/views/Admin/SocialLogin/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { socialLoginAll } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/** GET /admin/social-login */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    return renderPage(AdminSocialLogin, 'Admin/SocialLogin/Index', { settings: await socialLoginAll() }, {
        url: '/admin/social-login',
        isAdminRoute: true,
    });
}
