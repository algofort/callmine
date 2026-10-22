import { NextResponse } from 'next/server';
import { gateUser, handler } from '@/lib/guards';
import { readBody, validate, validationError } from '@/lib/http';
import { verifyPassword } from '@/lib/auth';
import { putSession } from '@/lib/auth/session';

/** POST /confirm-password */
export const POST = handler(async (request) => {
    const gate = await gateUser();
    if (gate.response) return gate.response;

    const body = await readBody(request);
    await validate(body, { password: ['required', 'string'] });

    if (!(await verifyPassword(body.password, gate.user.password))) {
        return validationError({ password: ['The provided password is incorrect.'] });
    }

    await putSession({ password_confirmed_at: Math.floor(Date.now() / 1000) });
    return NextResponse.json({ redirect: '/app/dashboard' });
});
