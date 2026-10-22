'use client';

/**
 * The page/navigation layer the whole UI is built on.
 *
 * Screens stay plain React components that read their data from props and post
 * mutations through `router` / `useForm`, instead of each one wiring up its own
 * fetch calls and loading state. Everything sits on the Next.js App Router:
 *
 *   - page props arrive from a server component through <PageProvider>
 *   - GET visits become router.push / replace with a query string
 *   - POST/PUT/PATCH/DELETE visits become fetch() calls to a route handler
 *     that answers { redirect?, flash?, errors? }
 *   - a 422 response populates `errors` on the form that sent it
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { route, setCurrentPath } from './route';
import {
    finishRouteProgress,
    startRouteProgress,
    withRouteProgress,
} from '@/components/RouteProgress';

const PageContext = createContext({ props: {}, url: '/', component: '' });

/** Client-side overlay for flash/errors produced by a shim request. */
let overlayListeners = new Set();
let overlay = { flash: null, errors: null };

function setOverlay(next) {
    overlay = { ...overlay, ...next };
    overlayListeners.forEach((fn) => fn(overlay));
}

function useOverlay() {
    const [value, setValue] = useState(overlay);
    useEffect(() => {
        const fn = (v) => setValue({ ...v });
        overlayListeners.add(fn);
        return () => overlayListeners.delete(fn);
    }, []);
    return value;
}

/**
 * Wraps every page. `shared` reproduces , `props`
 * is what the controller passed to .
 */
export function PageProvider({ shared = {}, props = {}, component = '', url = '/', children }) {
    const live = useOverlay();
    const pathname = usePathname();
    const search = useSearchParams();

    const currentUrl = useMemo(() => {
        const qs = search?.toString();
        return (pathname || url) + (qs ? `?${qs}` : '');
    }, [pathname, search, url]);

    useEffect(() => {
        setCurrentPath(pathname || url);
    }, [pathname, url]);

    const value = useMemo(
        () => ({
            component,
            url: currentUrl,
            props: {
                ...shared,
                ...props,
                flash: { ...(shared.flash ?? {}), ...(live.flash ?? {}) },
                errors: { ...(props.errors ?? {}), ...(live.errors ?? {}) },
            },
        }),
        [shared, props, component, currentUrl, live],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePage() {
    return useContext(PageContext);
}

/**
 * `<Head title="Agents" />` — per-page title. Next owns <head>, so this
 * only syncs document.title, which is all the ported pages use it for.
 */
export function Head({ title, children }) {
    useEffect(() => {
        if (!title) return;
        const appName = process.env.NEXT_PUBLIC_APP_NAME || 'CallMineAI';
        const previous = document.title;
        document.title = `${title} - ${appName}`;
        return () => {
            document.title = previous;
        };
    }, [title]);

    return children ?? null;
}

/* ------------------------------------------------------------------ router */

let nextRouter = null; // set by <RouterBridge>, needed outside hooks

/** Mounted once in the root layout so the imperative `router` has a navigator. */
export function RouterBridge() {
    const r = useRouter();
    useEffect(() => {
        nextRouter = r;
    }, [r]);
    return null;
}

function navigate(url, { replace = false } = {}) {
    if (nextRouter) {
        // Inside a transition so <RouteProgress> can track the real pending state.
        withRouteProgress(() => (replace ? nextRouter.replace(url) : nextRouter.push(url)));
    } else if (typeof window !== 'undefined') {
        replace ? window.location.replace(url) : window.location.assign(url);
    }
}

function refresh() {
    if (nextRouter) withRouteProgress(() => nextRouter.refresh());
    else if (typeof window !== 'undefined') window.location.reload();
}

function buildQuery(data) {
    const qs = new URLSearchParams();
    const walk = (prefix, value) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((v) => walk(`${prefix}[]`, v));
        } else if (typeof value === 'object' && !(value instanceof File)) {
            Object.entries(value).forEach(([k, v]) => walk(prefix ? `${prefix}[${k}]` : k, v));
        } else {
            qs.append(prefix, String(value));
        }
    };
    Object.entries(data ?? {}).forEach(([k, v]) => walk(k, v));
    return qs.toString();
}

function hasFiles(data) {
    if (!data || typeof data !== 'object') return false;
    return Object.values(data).some(
        (v) =>
            v instanceof File ||
            v instanceof Blob ||
            (Array.isArray(v) && v.some((i) => i instanceof File || i instanceof Blob)),
    );
}

function toFormData(data) {
    const fd = new FormData();
    const walk = (prefix, value) => {
        if (value === undefined) return;
        if (value === null) {
            fd.append(prefix, '');
        } else if (value instanceof File || value instanceof Blob) {
            fd.append(prefix, value);
        } else if (Array.isArray(value)) {
            if (value.length === 0) fd.append(`${prefix}[]`, '');
            else value.forEach((v, i) => walk(`${prefix}[${i}]`, v));
        } else if (typeof value === 'boolean') {
            fd.append(prefix, value ? '1' : '0');
        } else if (typeof value === 'object' && !(value instanceof Date)) {
            Object.entries(value).forEach(([k, v]) => walk(`${prefix}[${k}]`, v));
        } else {
            fd.append(prefix, String(value));
        }
    };
    Object.entries(data ?? {}).forEach(([k, v]) => walk(k, v));
    return fd;
}

/**
 * A page and its mutations share one URI (GET /app/agents,
 * POST /app/agents). The App Router cannot host a `page` and a `route` on one
 * segment, so mutations are served from the same path under `/api`. The mapping
 * is mechanical, which keeps every `route()` call in the UI unchanged.
 */
export function apiUrl(url) {
    const [path, query] = String(url).split('?');
    if (path.startsWith('/api/')) return url;
    return `/api${path}${query ? `?${query}` : ''}`;
}

/**
 * Performs a non-GET visit. Route handlers answer with
 * `{ redirect?, flash?, errors?, props? }`; 422 means validation failed.
 */
async function submit(method, url, data = {}, options = {}) {
    const {
        onBefore,
        onStart,
        onSuccess,
        onError,
        onFinish,
        onProgress,
        forceFormData = false,
        preserveScroll = false,
        replace = false,
    } = options;

    if (onBefore && onBefore() === false) return;
    onStart?.();
    startRouteProgress();
    setOverlay({ errors: null });

    const useForm = forceFormData || hasFiles(data);
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    try {
        const res = await fetch(apiUrl(url), {
            method: method.toUpperCase(),
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(useForm ? {} : { 'Content-Type': 'application/json' }),
            },
            body: useForm ? toFormData(data) : JSON.stringify(data ?? {}),
            credentials: 'same-origin',
        });

        onProgress?.({ percentage: 100 });

        let payload = {};
        const type = res.headers.get('content-type') || '';
        if (type.includes('application/json')) {
            payload = await res.json().catch(() => ({}));
        }

        if (res.status === 422) {
            const errors = payload.errors ?? {};
            setOverlay({ errors });
            finishRouteProgress(); // nothing navigates after a validation failure
            onError?.(errors);
            return { errors };
        }

        if (!res.ok) {
            const message = payload.message || `Request failed (${res.status})`;
            setOverlay({ flash: { error: message }, errors: payload.errors ?? null });
            finishRouteProgress();
            onError?.(payload.errors ?? { message });
            return { errors: payload.errors ?? { message } };
        }

        if (payload.flash) setOverlay({ flash: payload.flash });

        onSuccess?.(payload);

        if (payload.redirect) {
            navigate(payload.redirect, { replace });
        } else {
            refresh();
        }

        if (preserveScroll && typeof window !== 'undefined') {
            requestAnimationFrame(() => window.scrollTo(0, scrollY));
        }

        return payload;
    } catch (e) {
        const errors = { message: e?.message || 'Network error' };
        setOverlay({ flash: { error: errors.message } });
        finishRouteProgress();
        onError?.(errors);
        return { errors };
    } finally {
        onFinish?.();
    }
}

function visitGet(url, data = {}, options = {}) {
    const { replace = false, onBefore, onStart, onSuccess, onFinish } = options;
    if (onBefore && onBefore() === false) return;
    onStart?.();

    const [base, existing] = String(url).split('?');
    const merged = new URLSearchParams(existing || '');
    const extra = buildQuery(data);
    if (extra) {
        for (const [k, v] of new URLSearchParams(extra)) merged.set(k, v);
    }
    // Drop empty values so cleared filters leave the address bar instead of
    // lingering as empty query parameters.
    for (const [k, v] of [...merged]) if (v === '') merged.delete(k);

    const qs = merged.toString();
    navigate(base + (qs ? `?${qs}` : ''), { replace });
    onSuccess?.({});
    onFinish?.();
}

export const router = {
    visit(url, options = {}) {
        const method = (options.method || 'get').toLowerCase();
        return method === 'get'
            ? visitGet(url, options.data, options)
            : submit(method, url, options.data, options);
    },
    get: (url, data, options) => visitGet(url, data, options),
    post: (url, data, options) => submit('post', url, data, options),
    put: (url, data, options) => submit('put', url, data, options),
    patch: (url, data, options) => submit('patch', url, data, options),
    delete: (url, options = {}) => submit('delete', url, options.data ?? {}, options),
    reload: (options = {}) => {
        refresh();
        options.onSuccess?.({});
        options.onFinish?.();
    },
    replace: (url, options = {}) => visitGet(url, options.data, { ...options, replace: true }),
    on: () => () => {},
    cancel: () => {},
    remember: () => {},
    restore: () => undefined,
};

/* -------------------------------------------------------------------- Link */

export function Link({
    href = '#',
    method = 'get',
    as,
    data,
    headers,
    onClick,
    preserveScroll,
    preserveState,
    replace,
    only,
    children,
    ...rest
}) {
    const verb = String(method).toLowerCase();

    if (verb === 'get') {
        return (
            <NextLink href={href} onClick={onClick} replace={replace} scroll={!preserveScroll} {...rest}>
                {children}
            </NextLink>
        );
    }

    const handle = (e) => {
        e.preventDefault();
        onClick?.(e);
        submit(verb, href, data, { preserveScroll, replace });
    };

    if (as === 'button') {
        return (
            <button type="button" onClick={handle} {...rest}>
                {children}
            </button>
        );
    }

    return (
        <a href={href} onClick={handle} {...rest}>
            {children}
        </a>
    );
}

/* ----------------------------------------------------------------- useForm */

export function useForm(initial = {}) {
    const [defaults, setDefaults] = useState(() => ({ ...initial }));
    const [data, setDataState] = useState(() => ({ ...initial }));
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const transformRef = useRef((d) => d);
    const successTimer = useRef(null);

    useEffect(() => () => clearTimeout(successTimer.current), []);

    const setData = useCallback((keyOrObject, value) => {
        if (typeof keyOrObject === 'string') {
            setDataState((prev) => ({ ...prev, [keyOrObject]: value }));
        } else if (typeof keyOrObject === 'function') {
            setDataState((prev) => keyOrObject(prev));
        } else {
            setDataState((prev) => ({ ...prev, ...keyOrObject }));
        }
    }, []);

    const reset = useCallback(
        (...fields) => {
            setDataState((prev) =>
                fields.length
                    ? { ...prev, ...Object.fromEntries(fields.map((f) => [f, defaults[f]])) }
                    : { ...defaults },
            );
        },
        [defaults],
    );

    const clearErrors = useCallback((...fields) => {
        setErrors((prev) => {
            if (!fields.length) return {};
            const next = { ...prev };
            fields.forEach((f) => delete next[f]);
            return next;
        });
    }, []);

    const setError = useCallback((keyOrObject, message) => {
        setErrors((prev) =>
            typeof keyOrObject === 'string'
                ? { ...prev, [keyOrObject]: message }
                : { ...prev, ...keyOrObject },
        );
    }, []);

    const transform = useCallback((fn) => {
        transformRef.current = fn;
    }, []);

    const run = useCallback(
        (method, url, options = {}) => {
            const payload = transformRef.current({ ...data });
            setProcessing(true);
            setWasSuccessful(false);

            const verb = String(method).toLowerCase();
            const send = verb === 'get' ? null : submit;

            if (!send) {
                visitGet(url, payload, options);
                setProcessing(false);
                return Promise.resolve({});
            }

            return send(verb, url, payload, {
                ...options,
                onProgress: (p) => {
                    setProgress(p);
                    options.onProgress?.(p);
                },
                onSuccess: (page) => {
                    setErrors({});
                    setWasSuccessful(true);
                    setRecentlySuccessful(true);
                    clearTimeout(successTimer.current);
                    successTimer.current = setTimeout(() => setRecentlySuccessful(false), 2000);
                    options.onSuccess?.(page);
                },
                onError: (errs) => {
                    setErrors(errs ?? {});
                    options.onError?.(errs);
                },
                onFinish: () => {
                    setProcessing(false);
                    setProgress(null);
                    options.onFinish?.();
                },
            });
        },
        [data],
    );

    const isDirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(defaults), [data, defaults]);

    return {
        data,
        setData,
        defaults,
        setDefaults: (key, value) => {
            setDefaults((prev) =>
                typeof key === 'string' ? { ...prev, [key]: value } : { ...prev, ...(key ?? data) },
            );
        },
        errors,
        setError,
        clearErrors,
        hasErrors: Object.keys(errors).length > 0,
        processing,
        progress,
        wasSuccessful,
        recentlySuccessful,
        isDirty,
        transform,
        reset,
        cancel: () => setProcessing(false),
        submit: (method, url, options) => run(method, url, options),
        get: (url, options) => run('get', url, options),
        post: (url, options) => run('post', url, options),
        put: (url, options) => run('put', url, options),
        patch: (url, options) => run('patch', url, options),
        delete: (url, options) => run('delete', url, options),
    };
}

export { route };
