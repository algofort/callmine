import { NextResponse } from 'next/server';
import { handler } from '@/lib/guards';
import { forgetSession } from '@/lib/auth/session';

/** POST /logout */
export const POST = handler(async () => {
    await forgetSession();
    return NextResponse.json({ redirect: '/' });
});
