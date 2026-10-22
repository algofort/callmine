import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { readBody, validate, validationError } from '@/lib/http';
import { verifyPassword } from '@/lib/auth';
import { writeSession } from '@/lib/auth/session';
import { availableIn, clear, hit, throttleKey, tooManyAttempts } from '@/lib/rate-limit';

/**
 * POST /login via LoginRequest.
 * Same 5-attempt throttle keyed on email+IP.
 */
export const POST = handler(async (request) => {
    const body = await readBody(request);
    await validate(body, {
        email: ['required', 'string', 'email'],
        password: ['required', 'string'],
    });

    const key = throttleKey(body.email, request);

    if (await tooManyAttempts(key, 5)) {
        const seconds = await availableIn(key);
        return validationError({
            email: [
                `Too many login attempts. Please try again in ${seconds} seconds.`,
            ],
        });
    }

    const user = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase() } });
    const valid = user && (await verifyPassword(body.password, user.password));

    if (!valid) {
        await hit(key);
        return validationError({ email: ['These credentials do not match our records.'] });
    }

    if ((user.status ?? 'active') !== 'active') {
        await hit(key);
        return validationError({ email: ['Your account is inactive.'] });
    }

    await clear(key);
    await writeSession({
        uid: Number(user.id),
        client_id: user.client_id ? Number(user.client_id) : null,
        current_tenant_id: user.tenant_id ? Number(user.tenant_id) : null,
        locale: user.locale ?? null,
        theme: user.theme ?? 'light',
    });

    const url = new URL(request.url);
    const intended = url.searchParams.get('redirect');

    return NextResponse.json({
        redirect: intended && intended.startsWith('/') ? intended : '/app/dashboard',
    });
});
