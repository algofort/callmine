import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { handler } from '@/lib/guards';
import { readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { sendTemplateMail } from '@/lib/services/mail';

/**
 * POST /forgot-password.
 * Writes a hashed `password_reset_tokens` row and mails the
 * reset link through the app's SMTP + template.
 */
export const POST = handler(async (request) => {
    const body = await readBody(request);
    const data = await validate(body, { email: ['required', 'email'] });

    const email = String(data.email).toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return validationError({ email: ["We can't find a user with that email address."] });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.passwordResetToken.upsert({
        where: { email },
        create: { email, token: await hashPassword(token), created_at: new Date() },
        update: { token: await hashPassword(token), created_at: new Date() },
    });

    const resetUrl = `${config.app.url}/reset-password/${token}?email=${encodeURIComponent(email)}`;

    const sent = await sendTemplateMail('reset_password', email, {
        app_name: config.app.name,
        reset_url: resetUrl,
    });

    if (!sent && config.app.debug) {
        console.info('[forgot-password] no mailer configured; reset URL:', resetUrl);
    }

    return NextResponse.json({
        flash: { success: 'We have emailed your password reset link.' },
        status: 'We have emailed your password reset link.',
    });
});
