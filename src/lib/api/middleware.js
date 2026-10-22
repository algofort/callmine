import 'server-only';

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { findValidApiKey, hasScope } from '@/lib/domain/api-keys';
import { availableIn, hit, tooManyAttempts } from '@/lib/rate-limit';

/**
 * Port of the API middleware stack: api.log -> api.auth -> api.ratelimit ->
 * demo -> api.scope. `apiRoute()` composes them around a handler so each
 * endpoint file stays a single function.
 */

function json(body, status = 200, headers = {}) {
    return NextResponse.json(body, { status, headers });
}

function clientIp(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
    );
}

/** — an empty whitelist allows every address. */
function matchesIp(key, ip) {
    const list = key.ip_whitelist ?? [];
    if (!Array.isArray(list) || list.length === 0) return true;
    return list.includes(ip);
}

/**
 * Wraps an API handler with the full middleware chain.
 *
 *   export const GET = apiRoute('calls:read', async (request, ctx) => { ... });
 *
 * `ctx.key` and `ctx.clientId` are the authenticated key and its customer.
 */
export function apiRoute(scope, fn) {
    return async (request, context) => {
        const start = Date.now();
        const requestId = crypto.randomUUID();

        let key = null;
        let response;

        try {
            if (!config.api.enabled) {
                response = json({ message: 'API is disabled.' }, 503);
            } else {
                // api.auth
                const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
                key = token ? await findValidApiKey(token) : null;

                if (!key) {
                    response = json({ message: 'Invalid or missing API key.' }, 401);
                } else if (!matchesIp(key, clientIp(request))) {
                    response = json({ message: 'IP not allowed for this API key.' }, 403);
                } else {
                    await prisma.apiKey
                        .update({ where: { id: key.id }, data: { last_used_at: new Date() } })
                        .catch(() => {});

                    // api.ratelimit
                    const max = Math.max(1, Number(key.rate_limit_per_min ?? config.api.default_rate_limit));
                    const bucket = `api_rl:${key.id}`;

                    if (await tooManyAttempts(bucket, max)) {
                        response = json({ message: 'Rate limit exceeded.' }, 429, {
                            'Retry-After': String(await availableIn(bucket)),
                        });
                    } else {
                        const used = await hit(bucket, config.api.rate_window_seconds);

                        // demo
                        if (
                            config.app.demo_mode &&
                            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
                        ) {
                            response = json({ message: 'Demo mode: changes are disabled.' }, 403);
                        } else if (scope && !hasScope(key, scope)) {
                            // api.scope
                            response = json({ message: `Missing required scope: ${scope}` }, 403);
                        } else {
                            response = await fn(request, {
                                ...context,
                                key,
                                clientId: key.client_id,
                                requestId,
                            });
                        }

                        response.headers.set('X-RateLimit-Limit', String(max));
                        response.headers.set('X-RateLimit-Remaining', String(Math.max(0, max - used)));
                    }
                }
            }
        } catch (e) {
            if (e?.name === 'ValidationFailed') {
                response = json({ message: 'The given data was invalid.', errors: e.errors }, 422);
            } else if (e?.response) {
                response = e.response;
            } else {
                console.error('[api]', e);
                response = json({ message: config.app.debug ? e.message : 'Server error.' }, 500);
            }
        }

        response.headers.set('X-Request-Id', requestId);

        // Logged after the response is built, so it never delays the caller.
        logApiRequest(request, response, key, start, requestId).catch(() => {});

        return response;
    };
}

async function logApiRequest(request, response, key, start, requestId) {
    const path = new URL(request.url).pathname.replace(/^\//, '').slice(0, 250);

    await prisma.apiAuditLog.create({
        data: {
            api_key_id: key?.id ?? null,
            client_id: key?.client_id ?? null,
            method: request.method,
            path,
            status_code: response.status,
            ip: clientIp(request),
            duration_ms: Date.now() - start,
            request_id: requestId,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

export { json as apiJson };
