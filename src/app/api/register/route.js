import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { readBody, validate } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { writeSession } from '@/lib/auth/session';
import { sendTemplateMail } from '@/lib/services/mail';
import { verificationUrl } from '@/lib/auth/verification';
import config from '@/lib/config';

/**
 * POST /register.
 * Creates the user, fires the "Registered" side effect (verification mail) and
 * logs them straight in.
 */
export const POST = handler(async (request) => {
    const body = await readBody(request);

    const data = await validate(
        body,
        {
            name: ['required', 'string', 'max:255'],
            email: ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            password: ['required', 'string', 'min:8', 'confirmed'],
        },
        { prisma },
    );

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: String(data.email).toLowerCase(),
            password: await hashPassword(data.password),
            role: 'client',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // event(new Registered($user)) -> SendEmailVerificationNotification
    try {
        await sendTemplateMail('email_verification', user.email, {
            app_name: config.app.name,
            verification_url: await verificationUrl(user),
        });
    } catch (e) {
        console.error('[register] verification mail failed:', e?.message);
    }

    await writeSession({
        uid: Number(user.id),
        client_id: null,
        current_tenant_id: null,
        locale: user.locale ?? null,
        theme: 'light',
    });

    return NextResponse.json({ redirect: '/app/dashboard' });
});
