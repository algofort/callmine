import 'server-only';

import crypto from 'node:crypto';
import { signingKeyBytes } from '@/lib/app-key';

/**
 * A per-client bearer token the in-call agent presents when it calls back into
 * the app to send an email or a WhatsApp message.
 *
 * The token is an HMAC over the client id keyed on the install's secret. That
 * key must never be empty — an empty key would make the token a pure function
 * of the client id, so anyone could compute another tenant's token and drive
 * its messaging endpoints. `signingKeyBytes()` throws instead.
 */
export function agentToolsToken(clientId) {
    const key = signingKeyBytes();
    return crypto
        .createHmac('sha256', key)
        .update(`agent-tools:${clientId}`)
        .digest('hex')
        .slice(0, 40);
}

export function agentTokenMatches(clientId, presented) {
    let expected;
    try {
        expected = agentToolsToken(clientId);
    } catch {
        // No signing key configured — deny rather than accept anything.
        return false;
    }

    const a = Buffer.from(expected);
    const b = Buffer.from(String(presented ?? ''));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
