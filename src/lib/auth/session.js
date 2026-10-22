import 'server-only';

import { cookies } from 'next/headers';
import {
    ADMIN_COOKIE,
    LIFETIME,
    USER_COOKIE,
    cookieOptions,
    signToken,
    verifyToken,
} from './jwt';

/**
 * Two session guards: one for customers, one for the admin panel.
 *
 *   `web`   guard -> users        -> cookie `cm_session`
 *   `admin` guard -> admin_users  -> cookie `cm_admin`
 *
 * The session payload also carries the per-request preferences:
 * current_tenant_id, display_currency and the impersonation flags.
 */

export { USER_COOKIE, ADMIN_COOKIE };

/** Raw session bag for the web guard (null when logged out). */
export async function getSession() {
    const jar = await cookies();
    return verifyToken(jar.get(USER_COOKIE)?.value);
}

/** Raw session bag for the admin guard. */
export async function getAdminSession() {
    const jar = await cookies();
    return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Replace the web-guard session. */
export async function writeSession(payload, maxAge = LIFETIME) {
    const jar = await cookies();
    jar.set(USER_COOKIE, await signToken(payload, maxAge), cookieOptions(maxAge));
}

/** Merge keys into the existing customer-side session. */
export async function putSession(patch) {
    const current = (await getSession()) ?? {};
    delete current.iat;
    delete current.exp;
    await writeSession({ ...current, ...patch });
}

export async function writeAdminSession(payload, maxAge = LIFETIME) {
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, await signToken(payload, maxAge), cookieOptions(maxAge));
}

export async function forgetSession() {
    const jar = await cookies();
    jar.delete(USER_COOKIE);
}

export async function forgetAdminSession() {
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
}
