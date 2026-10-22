import { NextResponse } from 'next/server';
import { handler } from '@/lib/guards';
import { forgetAdminSession } from '@/lib/auth/session';

/** POST /admin/logout (allowed in demo mode). */
export const POST = handler(async () => {
    await forgetAdminSession();
    return NextResponse.json({ redirect: '/admin/login' });
});
