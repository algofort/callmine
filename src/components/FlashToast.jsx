'use client';

import { useEffect, useState } from 'react';
import { usePage } from '@/lib/page-router';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/** Trigger a toast from anywhere in the client (outside the flash bag). */
export function showToast(msg, type = 'success') {
    if (typeof window !== 'undefined' && msg) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg, type } }));
    }
}

/**
 * Global toast — renders page flash (props.flash.{success,error}) AND any
 * `showToast()` calls. Auto-dismisses; re-shows on each new message.
 */
export default function FlashToast() {
    const page = usePage();
    const flash = page.props?.flash ?? {};
    const errors = page.props?.errors ?? {};
    const [toast, setToast] = useState(null); // { type, msg }

    useEffect(() => {
        const msg = flash.success || flash.error;
        if (!msg) return;
        setToast({ type: flash.success ? 'success' : 'error', msg });
        const t = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(t);
    }, [flash.success, flash.error]);

    // Surface server validation errors as a toast (the app convention) so the
    // specific reason shows even when a page has no inline field errors — e.g.
    // "These credentials do not match our records." on the login page.
    useEffect(() => {
        const keys = Object.keys(errors);
        if (!keys.length) return;
        const first = errors[keys[0]];
        const msg = Array.isArray(first) ? first[0] : first;
        if (msg) setToast({ type: 'error', msg });
    }, [JSON.stringify(errors)]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onToast = (e) => {
            setToast({ type: e.detail?.type || 'success', msg: e.detail?.msg });
        };
        window.addEventListener('app:toast', onToast);
        return () => window.removeEventListener('app:toast', onToast);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(t);
    }, [toast]);

    if (!toast) return null;
    const ok = toast.type === 'success';

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:pr-6">
            <div role="status" aria-live="polite"
                className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-soft-lg border px-4 py-3 shadow-soft-xl backdrop-blur ${ok
                    ? 'border-signal-200 bg-white text-neutral-800 dark:border-signal-500/30 dark:bg-ink-900 dark:text-neutral-100'
                    : 'border-danger/30 bg-white text-neutral-800 dark:bg-ink-900 dark:text-neutral-100'}`}>
                {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-signal-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />}
                <p className="text-sm font-medium leading-snug">{toast.msg}</p>
                <button onClick={() => setToast(null)} className="ml-1 shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
