import 'server-only';

import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Port of App\Support\OutboundHttpGuard — SSRF guard for server-side fetches to
 * user-supplied URLs. Allows only http/https, resolves every A/AAAA record, and
 * rejects unless ALL resolved addresses are public.
 */

export async function resolveSafeTarget(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    if (!['http', 'https'].includes(scheme)) return null;

    const host = parsed.hostname;
    if (!host) return null;

    const port = Number(parsed.port || (scheme === 'https' ? 443 : 80));

    let ips = [];
    if (net.isIP(host)) {
        ips = [host];
    } else {
        for (const family of [4, 6]) {
            try {
                const records = await dns.resolve(host, family === 4 ? 'A' : 'AAAA');
                ips.push(...records);
            } catch {
                /* no records of this family */
            }
        }
    }

    if (ips.length === 0) return null;

    let safeIp = null;
    for (const ip of ips) {
        if (!isPublicIp(ip)) return null;
        safeIp ??= ip;
    }

    return { ip: safeIp, host, port };
}

/** Reject private, loopback and link-local addresses (IPv4-mapped IPv6 normalized). */
export function isPublicIp(address) {
    let ip = address;
    if (ip.includes('.') && ip.toLowerCase().startsWith('::ffff:')) {
        ip = ip.slice(ip.lastIndexOf(':') + 1);
    }

    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 10) return false;
        if (a === 127) return false;
        if (a === 0) return false;
        if (a === 172 && b >= 16 && b <= 31) return false;
        if (a === 192 && b === 168) return false;
        if (a === 169 && b === 254) return false;
        if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
        if (a >= 224) return false; // multicast + reserved
        return true;
    }

    if (net.isIPv6(ip)) {
        const lower = ip.toLowerCase();
        if (lower === '::' || lower === '::1') return false;
        if (lower.startsWith('fe80')) return false; // link-local
        if (/^f[cd]/.test(lower)) return false; // unique-local
        if (lower.startsWith('ff')) return false; // multicast
        return true;
    }

    return false;
}
