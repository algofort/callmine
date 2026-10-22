import { routes } from './route-manifest';

/**
 * Named-route helper. Pages refer to routes by name instead of hard-coding
 * paths, so a URI can change in one place.
 *
 *   route('client.agents.index')                    -> /app/agents
 *   route('client.agents.edit', 7)                  -> /app/agents/7/edit
 *   route('client.agents.edit', { agent: 7 })       -> /app/agents/7/edit
 *   route('client.calls.index', { status: 'done' }) -> /app/calls?status=done
 *   route().current('client.agents.*')              -> boolean
 */
export function route(name, params, absolute = false) {
    if (name === undefined) return routeHelpers();

    const def = routes[name];
    if (!def) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[route] unknown route name "${name}"`);
        }
        return '/';
    }

    let uri = def.uri;
    const segments = [...uri.matchAll(/\{(\w+)\??\}/g)].map((m) => m[1]);
    const bag = normalizeParams(params, segments);

    for (const seg of segments) {
        const token = new RegExp(`\\{${seg}\\??\\}`);
        const value = bag[seg];
        if (value === undefined || value === null || value === '') {
            // Optional segment ({foo?}) — drop it, required ones stay visible so
            // the broken link is obvious in dev.
            uri = uri.replace(new RegExp(`/?\\{${seg}\\?\\}`), '');
            continue;
        }
        uri = uri.replace(token, encodeURIComponent(String(value)));
        delete bag[seg];
    }

    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(bag)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) v.forEach((item) => query.append(`${k}[]`, String(item)));
        else if (typeof v === 'object') {
            for (const [ik, iv] of Object.entries(v)) query.append(`${k}[${ik}]`, String(iv));
        } else query.append(k, String(v));
    }

    const qs = query.toString();
    const path = (uri || '/') + (qs ? `?${qs}` : '');

    return absolute ? `${appUrl()}${path}` : path;
}

function normalizeParams(params, segments) {
    if (params === undefined || params === null) return {};

    // route('x.show', 7) / route('x.show', 'abc')
    if (typeof params === 'string' || typeof params === 'number' || typeof params === 'bigint') {
        return segments.length ? { [segments[0]]: params } : {};
    }

    // route('x.show', [7, 'a'])
    if (Array.isArray(params)) {
        const bag = {};
        params.forEach((value, i) => {
            if (segments[i]) bag[segments[i]] = value;
        });
        return bag;
    }

    // route('x.show', model) where model is { id, ... } and the segment is unnamed-ish
    const bag = { ...params };
    for (const seg of segments) {
        if (bag[seg] === undefined) continue;
        const value = bag[seg];
        // A record object may be passed for a binding; use its route key.
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            bag[seg] = value.id ?? value.uuid ?? value.slug ?? value.code ?? value;
        }
    }
    if (segments.length === 1 && bag[segments[0]] === undefined && (params.id ?? params.slug) !== undefined) {
        bag[segments[0]] = params.id ?? params.slug;
        delete bag.id;
    }
    return bag;
}

function appUrl() {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    );
}

function routeHelpers() {
    const path = typeof window !== 'undefined' ? window.location.pathname : currentPath();

    return {
        current(pattern) {
            if (!pattern) return currentName(path);
            const rx = new RegExp('^' + pattern.split('*').map(escapeRx).join('.*') + '$');
            const name = currentName(path);
            return name ? rx.test(name) : false;
        },
        params: {},
    };
}

function escapeRx(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Reverse lookup: URL path -> route name (best match, longest literal prefix). */
export function currentName(path) {
    if (!path) return null;
    let best = null;
    let bestScore = -1;
    for (const [name, def] of Object.entries(routes)) {
        const rx = new RegExp('^' + def.uri.replace(/\{\w+\??\}/g, '[^/]+').replace(/\//g, '\\/') + '$');
        if (rx.test(path)) {
            const score = def.uri.replace(/\{\w+\??\}/g, '').length;
            if (score > bestScore) {
                best = name;
                bestScore = score;
            }
        }
    }
    return best;
}

// A module-level holder lets server components tell `route()` what the current
// path is (there is no `window` during SSR).
let serverPath = '/';
export function setCurrentPath(path) {
    serverPath = path || '/';
}
function currentPath() {
    return serverPath;
}

/** Resolve the HTTP verb registered for a named route. */
export function routeMethod(name) {
    const def = routes[name];
    if (!def) return 'GET';
    return def.methods.find((m) => m !== 'HEAD') ?? 'GET';
}

// `route()` is also exposed globally so pages can call it without importing.
if (typeof globalThis !== 'undefined' && typeof globalThis.route !== 'function') {
    globalThis.route = route;
}

export default route;
