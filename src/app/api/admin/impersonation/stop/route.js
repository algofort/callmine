import { handler } from '@/lib/guards';
import { redirectTo } from '@/lib/http';
import { forgetSession, getSession } from '@/lib/auth/session';

/**
 * POST /admin/impersonation/stop.
 * Callable by the impersonated user (web guard); no admin auth required, and
 * allowed in demo mode so a demo visitor is never stranded.
 */
export const POST = handler(async () => {
    const session = await getSession();

    if (!session?.impersonating) {
        return redirectTo('/app/dashboard');
    }

    // Drop the impersonated web session; the admin session was never touched.
    await forgetSession();

    return redirectTo('/admin/clients', { success: 'Impersonation ended.' });
});
