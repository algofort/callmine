import prisma from '@/lib/prisma';
import { gateUser, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { hashPassword, verifyPassword } from '@/lib/auth';

/** PUT /password */
export const PUT = handler(async (request) => {
    const gate = await gateUser({ routeName: 'password.update' });
    if (gate.response) return gate.response;

    const body = await readBody(request);
    await validate(body, {
        current_password: ['required', 'string'],
        password: ['required', 'string', 'min:8', 'confirmed'],
    });

    if (!(await verifyPassword(body.current_password, gate.user.password))) {
        return validationError({ current_password: ['The password is incorrect.'] });
    }

    await prisma.user.update({
        where: { id: gate.user.id },
        data: { password: await hashPassword(body.password), updated_at: new Date() },
    });

    return back({ success: 'Password updated.' });
});
