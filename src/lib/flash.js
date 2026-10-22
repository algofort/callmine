import 'server-only';

import { cookies } from 'next/headers';

/**
 * One-request flash bag. Flash is returned inline for XHR
 * visits; this cookie covers full-page redirects (login, checkout returns).
 */
const COOKIE = 'cm_flash';

export async function setFlash(bag) {
    const jar = await cookies();
    jar.set(COOKIE, JSON.stringify(bag ?? {}), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60,
    });
}

/** Read and clear. Safe to call from a server component. */
export async function takeFlash() {
    const jar = await cookies();
    const raw = jar.get(COOKIE)?.value;
    if (!raw) return { success: null, error: null };

    let bag = {};
    try {
        bag = JSON.parse(raw);
    } catch {
        bag = {};
    }

    try {
        jar.delete(COOKIE);
    } catch {
        // Server components cannot mutate cookies; the 60s maxAge cleans up.
    }

    return { success: null, error: null, ...bag };
}
