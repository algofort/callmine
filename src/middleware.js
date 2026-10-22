import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, USER_COOKIE, verifyToken } from '@/lib/auth/jwt';

/**
 * Coarse edge guard — the cheap half of the session checks; the
 * `guest` middleware. Server components still re-check the guard against the
 * database (status, role, verification); this only avoids rendering a portal
 * shell for a request with no session at all.
 */

const GUEST_ONLY = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Admin area (except its own login page) needs the admin cookie.
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const admin = await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);
        if (!admin?.uid) return NextResponse.redirect(new URL('/admin/login', request.url));
        return NextResponse.next();
    }

    // An authenticated admin skips the admin login page.
    if (pathname === '/admin/login') {
        const admin = await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);
        if (admin?.uid) return NextResponse.redirect(new URL('/admin', request.url));
        return NextResponse.next();
    }

    // Client portal.
    if (pathname.startsWith('/app')) {
        const session = await verifyToken(request.cookies.get(USER_COOKIE)?.value);
        if (!session?.uid) {
            const url = new URL('/login', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Guest-only auth screens.
    if (GUEST_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        const session = await verifyToken(request.cookies.get(USER_COOKIE)?.value);
        if (session?.uid) return NextResponse.redirect(new URL('/app/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Everything except static assets, images and the public storage folder.
        '/((?!_next/static|_next/image|favicon.ico|storage|images|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp3|css|js|map)$).*)',
    ],
};
