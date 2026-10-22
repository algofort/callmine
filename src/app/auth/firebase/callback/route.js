import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { readBody, validate, validationError } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { writeSession } from '@/lib/auth/session';
import { socialLoginPayload } from '@/lib/settings';

/**
 * POST /auth/firebase/callback — completes a Google sign-in.
 *
 * The browser signs in against Firebase and posts the resulting ID token here.
 * We verify that token server-side before trusting anything in it: an ID token
 * is a plain RS256 JWT, so it is checked against Google's published signing
 * keys and pinned to this install's Firebase project. Only then is a session
 * issued.
 *
 * Verification is done with `jose` against the public JWKS, so buyers only need
 * the web Firebase config from the admin panel — no service-account JSON.
 */

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks;
function googleJwks() {
    // createRemoteJWKSet caches and rotates the keys internally.
    jwks ??= createRemoteJWKSet(new URL(JWKS_URL));
    return jwks;
}

/** Verifies a Firebase ID token and returns its claims, or null. */
async function verifyIdToken(idToken, projectId) {
    try {
        const { payload } = await jwtVerify(idToken, googleJwks(), {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId,
            algorithms: ['RS256'],
        });

        // `sub` is the Firebase UID and must be present on a real ID token.
        if (!payload.sub) return null;
        return payload;
    } catch {
        return null;
    }
}

const rejected = (message) => validationError({ social_login: [message] });

export const POST = handler(async (request) => {
    const body = await readBody(request);
    await validate(body, { id_token: ['required', 'string'] });

    const social = await socialLoginPayload();
    if (!social.enabled || !social.google) {
        return rejected('Google sign-in is not enabled for this site.');
    }

    const projectId = social.firebase?.projectId;
    if (!projectId) {
        return rejected('Google sign-in is not configured correctly. Contact the site administrator.');
    }

    const claims = await verifyIdToken(body.id_token, projectId);
    if (!claims) {
        return rejected('We could not verify your Google sign-in. Please try again.');
    }

    const email = String(claims.email || '').toLowerCase();
    if (!email) {
        return rejected('Your Google account did not share an email address.');
    }
    if (claims.email_verified === false) {
        return rejected('Verify your email address with Google before signing in.');
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // First sign-in: create the account. The password column is required, so
        // it gets a random value nobody holds — this account signs in via Google
        // until its owner sets a password through the reset flow.
        user = await prisma.user.create({
            data: {
                name: String(claims.name || email.split('@')[0]).slice(0, 255),
                email,
                password: await hashPassword(crypto.randomBytes(32).toString('hex')),
                role: 'client',
                status: 'active',
                // Google already proved the address, so skip our own verification.
                email_verified_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    if (user.role !== 'client') {
        return rejected('This email belongs to a staff account. Sign in from the admin panel.');
    }

    if ((user.status ?? 'active') !== 'active') {
        return rejected('Your account is inactive.');
    }

    if (!user.email_verified_at) {
        // The address is proven by Google — record it so the app stops nagging.
        user = await prisma.user.update({
            where: { id: user.id },
            data: { email_verified_at: new Date(), updated_at: new Date() },
        });
    }

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
