'use client';

/**
 * Top-of-page navigation progress bar (the progress bar the app shows
 * us for free). Mounted once in the root layout so it survives every
 * navigation.
 *
 * It starts on three signals:
 *   - a left-click on a same-origin <a> (covers every <Link> in the UI)
 *   - `router.push/replace/refresh`, which routes through
 *     `withRouteProgress()` so a React transition reports the real pending state
 *   - browser back/forward (popstate)
 *
 * It finishes when the route commits (pathname/query change), when the
 * transition stops pending, or when a shim request fails without navigating.
 */

import { Suspense, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/** Handle installed by the mounted bar, so non-React code can drive it. */
let handle = null;

export function startRouteProgress() {
    handle?.start();
}

export function finishRouteProgress() {
    handle?.finish();
}

/** Runs `fn` inside a transition so the bar tracks the navigation itself. */
export function withRouteProgress(fn) {
    if (!handle) return fn();
    handle.start();
    handle.transition(fn);
}

const SHOW_DELAY = 120; // instant navigations never flash a bar
const TRICKLE_MS = 180;
const SAFETY_MS = 15000; // never leave the bar stuck on a lost signal

function ProgressBar() {
    const pathname = usePathname();
    const search = useSearchParams();
    const query = search?.toString() ?? '';

    const [isPending, startTransition] = useTransition();
    const [visible, setVisible] = useState(false);
    const [value, setValue] = useState(0);

    const running = useRef(false);
    const shown = useRef(false);
    const timers = useRef({ show: null, trickle: null, hide: null, safety: null });

    const clearTimers = useCallback(() => {
        clearTimeout(timers.current.show);
        clearInterval(timers.current.trickle);
        clearTimeout(timers.current.hide);
        clearTimeout(timers.current.safety);
        timers.current = { show: null, trickle: null, hide: null, safety: null };
    }, []);

    const finish = useCallback(() => {
        if (!running.current) return;
        running.current = false;
        clearTimers();

        // Never painted — the navigation beat the show delay, so stay silent.
        if (!shown.current) {
            setVisible(false);
            setValue(0);
            return;
        }

        setValue(100);
        timers.current.hide = setTimeout(() => {
            shown.current = false;
            setVisible(false);
            setValue(0);
        }, 280);
    }, [clearTimers]);

    const start = useCallback(() => {
        if (running.current) return;
        running.current = true;
        shown.current = false;
        clearTimers();
        setValue(0);
        setVisible(false);

        timers.current.show = setTimeout(() => {
            shown.current = true;
            setVisible(true);
            setValue(10);
            // Decelerating trickle: fast to ~60%, then crawls, capped at 92%.
            timers.current.trickle = setInterval(() => {
                setValue((v) => (v >= 92 ? v : v + Math.max(0.4, (94 - v) * 0.1)));
            }, TRICKLE_MS);
        }, SHOW_DELAY);

        timers.current.safety = setTimeout(finish, SAFETY_MS);
    }, [clearTimers, finish]);

    // Install the imperative handle for the router shim.
    useEffect(() => {
        handle = { start, finish, transition: startTransition };
        return () => {
            if (handle?.start === start) handle = null;
        };
    }, [start, finish, startTransition]);

    useEffect(() => clearTimers, [clearTimers]);

    // The new route committed.
    useEffect(() => {
        finish();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, query]);

    // A transition-wrapped visit reports its own pending state.
    useEffect(() => {
        if (isPending) start();
        else finish();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPending]);

    // Any same-origin link click starts the bar before Next takes over.
    useEffect(() => {
        const onClick = (e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const anchor = e.target?.closest?.('a[href]');
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const raw = anchor.getAttribute('href') ?? '';
            if (raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;

            let url;
            try {
                url = new URL(anchor.href, window.location.href);
            } catch {
                return;
            }
            if (url.origin !== window.location.origin) return;
            if (url.href === window.location.href) return;

            start();
        };

        const onPopState = () => start();

        document.addEventListener('click', onClick, true);
        window.addEventListener('popstate', onPopState);
        return () => {
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('popstate', onPopState);
        };
    }, [start]);

    if (!visible) return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
        >
            <div
                className="h-full rounded-r-full bg-gradient-to-r from-brand-500 via-brand-400 to-signal-400 shadow-[0_0_10px_rgba(109,63,234,0.7)] transition-[width] duration-200 ease-out"
                style={{ width: `${value}%` }}
            >
                {/* Leading glow, like NProgress' peg. */}
                <div className="float-right h-full w-24 -translate-y-px rotate-[2.5deg] opacity-90 shadow-[0_0_12px_rgba(109,63,234,0.9),0_0_6px_rgba(109,63,234,0.9)]" />
            </div>
        </div>
    );
}

export default function RouteProgress() {
    // useSearchParams needs a Suspense boundary inside the (static) root layout.
    return (
        <Suspense fallback={null}>
            <ProgressBar />
        </Suspense>
    );
}
