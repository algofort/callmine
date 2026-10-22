import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { verifyPassword } from '@/lib/auth';
import { forgetSession } from '@/lib/auth/session';

/** PATCH /app/profile */
export const PATCH = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.profile.update' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'string', 'email', 'max:255'],
    });

    const email = String(data.email).toLowerCase();

    const clash = await prisma.user.findFirst({ where: { email, id: { not: gate.user.id } } });
    if (clash) return validationError({ email: ['The email has already been taken.'] });

    // Changing the email re-opens verification.
    const emailChanged = email !== gate.user.email;

    await prisma.user.update({
        where: { id: gate.user.id },
        data: {
            name: data.name,
            email,
            ...(emailChanged ? { email_verified_at: null } : {}),
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/profile', { success: 'Profile updated.' });
});

/** DELETE /app/profile */
export const DELETE = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.profile.destroy' });
    if (gate.response) return gate.response;

    const body = await readBody(request);
    await validate(body, { password: ['required'] });

    if (!(await verifyPassword(body.password, gate.user.password))) {
        return validationError({ password: ['The provided password is incorrect.'] });
    }

    await forgetSession();
    await prisma.user.delete({ where: { id: gate.user.id } });

    return redirectTo('/');
});
