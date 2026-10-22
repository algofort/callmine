import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';

/** POST /reset-password (Password::reset). */
export const POST = handler(async (request) => {
    const body = await readBody(request);
    const data = await validate(body, {
        token: ['required'],
        email: ['required', 'email'],
        password: ['required', 'string', 'min:8', 'confirmed'],
    });

    const email = String(data.email).toLowerCase();
    const invalid = { email: ['This password reset token is invalid.'] };

    const row = await prisma.passwordResetToken.findUnique({ where: { email } });
    if (!row) return validationError(invalid);

    // Reset tokens expire after 60 minutes.
    if (row.created_at && Date.now() - new Date(row.created_at).getTime() > 60 * 60 * 1000) {
        await prisma.passwordResetToken.delete({ where: { email } }).catch(() => {});
        return validationError({ email: ['This password reset token has expired.'] });
    }

    if (!(await bcrypt.compare(String(data.token), row.token))) {
        return validationError(invalid);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return validationError(invalid);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: await hashPassword(data.password),
            remember_token: crypto.randomBytes(30).toString('hex').slice(0, 60),
            updated_at: new Date(),
        },
    });

    await prisma.passwordResetToken.delete({ where: { email } }).catch(() => {});

    return NextResponse.json({
        redirect: '/login?status=Your%20password%20has%20been%20reset.',
        flash: { success: 'Your password has been reset.' },
    });
});
