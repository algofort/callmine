/**
 * Prisma returns BigInt (unsigned bigint PKs), Decimal and Date instances which
 * cannot cross the RSC -> client boundary, and which the client expects as
 * plain numbers / ISO strings. `plain()` reproduces that JSON shape so the
 * React pages receive plain, serializable props.
 */
export function plain(value) {
    if (value === null || value === undefined) return value ?? null;

    const t = typeof value;
    if (t === 'bigint') return Number(value);
    if (t === 'number' || t === 'string' || t === 'boolean') return value;

    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) return value.map(plain);

    if (t === 'object') {
        // Prisma.Decimal (decimal.js) — emitted as a number the UI can format.
        if (typeof value.toNumber === 'function' && typeof value.toFixed === 'function') {
            return value.toNumber();
        }
        if (Buffer.isBuffer?.(value)) return value.toString('base64');

        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = plain(v);
        return out;
    }

    return value;
}

/** ISO-8601 with offset, matching . */
export function iso(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

/** "YYYY-MM-DD HH:mm:ss". */
export function dateTimeString(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

/** Carbon `diffForHumans()` — "3 hours ago", "2 days ago". */
export function diffForHumans(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;

    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    const future = seconds < 0;
    const abs = Math.abs(seconds);

    const units = [
        [31536000, 'year'],
        [2592000, 'month'],
        [604800, 'week'],
        [86400, 'day'],
        [3600, 'hour'],
        [60, 'minute'],
        [1, 'second'],
    ];

    for (const [size, name] of units) {
        if (abs >= size) {
            const n = Math.floor(abs / size);
            const label = `${n} ${name}${n === 1 ? '' : 's'}`;
            return future ? `${label} from now` : `${label} ago`;
        }
    }
    return 'just now';
}

/** "YYYY-MM-DD". */
export function dateString(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

export default plain;
