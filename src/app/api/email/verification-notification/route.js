import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { gateUser, handler } from '@/lib/guards';
import { sendTemplateMail } from '@/lib/services/mail';
import { verificationUrl } from '@/lib/auth/verification';

/** POST /email/verification-notification */
export const POST = handler(async () => {
    const gate = await gateUser();
    if (gate.response) return gate.response;

    if (gate.user.email_verified_at) {
        return NextResponse.json({ redirect: '/app/dashboard' });
    }

    await sendTemplateMail('email_verification', gate.user.email, {
        app_name: config.app.name,
        verification_url: await verificationUrl(gate.user),
    });

    return NextResponse.json({ flash: { success: 'A new verification link has been sent.' }, status: 'verification-link-sent' });
});
