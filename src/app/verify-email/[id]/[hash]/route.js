import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { currentUser } from '@/lib/auth';
import { emailVerificationHash, hasValidSignature } from '@/lib/auth/verification';
import config from '@/lib/config';

/** GET /verify-email/{id}/{hash} (signed). */
export const GET = handler(async (request, { params }) => {
    const { id, hash } = await params;

    if (!hasValidSignature(request.url)) {
        return NextResponse.redirect(new URL('/verify-email?status=invalid', config.app.url));
    }

    const user = await currentUser();
    if (!user) return NextResponse.redirect(new URL('/login', config.app.url));
    if (String(user.id) !== String(id)) return NextResponse.redirect(new URL('/verify-email', config.app.url));
    if (emailVerificationHash(user.email) !== hash) {
        return NextResponse.redirect(new URL('/verify-email?status=invalid', config.app.url));
    }

    if (!user.email_verified_at) {
        await prisma.user.update({
            where: { id: user.id },
            data: { email_verified_at: new Date(), updated_at: new Date() },
        });
    }

    return NextResponse.redirect(new URL('/app/dashboard?verified=1', config.app.url));
});
