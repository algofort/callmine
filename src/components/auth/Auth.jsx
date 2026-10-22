'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Link } from '@/lib/page-router';
import { Eye, EyeOff, Bot, Check, ArrowLeft, ShieldCheck, Copy, Zap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import BrandMark, { BrandName } from '@/components/BrandMark';
import FlashToast from '@/components/FlashToast';

/* Shared dark "operator console" auth chrome — matches the landing identity. */

const STYLE = `
@keyframes authwave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.authbar{width:3px;border-radius:9px;transform-origin:bottom;background:linear-gradient(to top,#6d3fea,#16d9a8);animation:authwave 1s ease-in-out infinite}
.authgrid{background-image:linear-gradient(to right,rgba(15,23,42,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(15,23,42,.06) 1px,transparent 1px);background-size:44px 44px}
.authgrid.dgrid{background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px)}
.authcanvas{background-color:#f4f4fb;background-image:radial-gradient(45rem 34rem at 15% -5%,rgba(109,63,234,.16),transparent 55%),radial-gradient(40rem 32rem at 100% 100%,rgba(22,217,168,.11),transparent 55%),radial-gradient(36rem 30rem at 90% 0%,rgba(79,176,255,.10),transparent 55%)}
.dark .authcanvas{background-color:#0c0c1c;background-image:none}
@media (prefers-reduced-motion:reduce){.authbar{animation:none!important}}
`;

export function GoogleIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
        </svg>
    );
}

export function GoogleButton({ onClick, loading, label = 'Continue with Google' }) {
    return (
        <button type="button" onClick={onClick} disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60">
            <GoogleIcon className="h-4.5 w-4.5" />
            {loading ? 'Signing in…' : label}
        </button>
    );
}

export function OrDivider() {
    return (
        <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-600">or</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
        </div>
    );
}

export function AuthField({ id, label, type = 'text', secret = false, value, onChange, error, ...rest }) {
    const [show, setShow] = useState(false);
    const inputType = secret ? (show ? 'text' : 'password') : type;
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    className={`auth-field w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-400 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-neutral-600 dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/25 ${error ? 'border-hot/50' : 'border-neutral-300 dark:border-white/10'} ${secret ? 'pr-10' : ''}`}
                    {...rest}
                />
                {secret && (
                    <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition hover:text-neutral-700 dark:hover:text-neutral-200">
                        {show ? <EyeOff className="h-4.5 w-4.5" strokeWidth={1.75} /> : <Eye className="h-4.5 w-4.5" strokeWidth={1.75} />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-hot">{error}</p>}
        </div>
    );
}

function CopyRow({ label, value }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard blocked */ }
    };
    return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500">{label}</p>
                <p className="truncate text-sm text-neutral-900 dark:text-white">{value}</p>
            </div>
            <button type="button" onClick={copy} aria-label={`Copy ${label}`}
                className="shrink-0 rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-neutral-200">
                {copied ? <Check className="h-4 w-4 text-signal-500" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
            </button>
        </div>
    );
}

/**
 * Demo-mode helper card: copyable credentials + one-click login button.
 * Renders nothing when `cred` is absent (i.e. demo mode off).
 */
export function DemoLoginCard({ cred, onOneClick, loading, hint = 'Try the demo account' }) {
    if (!cred) return null;
    return (
        <div className="mb-5 rounded-xl border border-dashed border-brand-400/50 bg-brand-500/[0.06] p-4 dark:border-brand-400/30 dark:bg-brand-500/10">
            <div className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-brand-600/15 px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Demo mode
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">{hint}</span>
            </div>

            <div className="mt-3 space-y-2">
                <CopyRow label="Email" value={cred.email} />
                <CopyRow label="Password" value={cred.password} />
            </div>

            <button type="button" onClick={onOneClick} disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                <Zap className="h-4 w-4" strokeWidth={2} />
                {loading ? 'Signing in…' : 'One-click demo login'}
            </button>
        </div>
    );
}

export function SubmitButton({ processing, children, loadingText }) {
    return (
        <button type="submit" disabled={processing}
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
            {processing ? (loadingText || 'Please wait…') : children}
        </button>
    );
}

const PANELS = {
    customer: {
        eyebrow: 'AI voice operator',
        title: <>Your AI callers,<br />always on the phones.</>,
        sub: 'Sign in to build agents, launch campaigns, and watch qualified leads land in your CRM — scored in real time.',
        bullets: ['Recorded, transcribed & scored calls', '29 languages with real accents', 'CRM sync & webhooks out of the box'],
    },
    admin: {
        eyebrow: 'Platform control',
        title: <>Run the whole platform<br />from one console.</>,
        sub: 'Oversee customers, plans, payments, engines and call activity — everything that keeps the business running, in one secure place.',
        bullets: ['Customers, subscriptions & payments', 'Engines & platform-wide call oversight', 'Roles, KYC & full audit trail'],
    },
};

function ConsolePanel({ variant = 'customer' }) {
    const p = PANELS[variant] || PANELS.customer;
    return (
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ink-950 md:block">
            <div className="authgrid dgrid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal-500/20 blur-[90px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-brand-400/25 blur-[90px]" aria-hidden="true" />

            <div className="relative flex h-full flex-col justify-between p-10">
                <div>
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-signal-300">
                        <span className="h-1.5 w-1.5 rounded-[2px] bg-signal-400" /> {p.eyebrow}
                    </span>
                    <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-white">{p.title}</h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-100/80">{p.sub}</p>
                </div>

                {/* mini live-call console */}
                <div className="my-8 overflow-hidden rounded-2xl border border-white/12 bg-ink-950/50 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Bot className="h-4 w-4" /></span>
                            <div>
                                <p className="text-xs font-semibold text-white">Ava · Sales Qualifier</p>
                                <p className="font-mono text-[10px] text-neutral-500">EN-US · live</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-signal-500/30 bg-signal-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-signal-400" /> 00:47
                        </span>
                    </div>
                    <div className="mt-3 flex items-end gap-[3px]" aria-hidden="true">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <span key={i} className="authbar h-9" style={{ animationDelay: `${(i % 12) * 70}ms`, animationDuration: `${820 + (i % 5) * 120}ms`, opacity: 0.5 + (i % 5) / 10 }} />
                        ))}
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg,#4fb0ff,#ffb23e 70%,#fb5e5e)' }} />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider">
                        <span className="text-cold">Cold</span><span className="text-warm">Warm · 72</span><span className="text-hot">Hot</span>
                    </div>
                </div>

                <ul className="space-y-2.5 text-sm text-brand-100/90">
                    {p.bullets.map((f) => (
                        <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-signal-400" />{f}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/**
 * Full-screen dark auth shell with a split card: form (children) + branded console.
 */
export default function AuthShell({ brand = 'CallMineAI', logoUrl, eyebrow, title, subtitle, footer, variant = 'customer', children }) {
    return (
        <div className="authcanvas relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-neutral-700 dark:text-neutral-300">
            <style>{STYLE}</style>
            <FlashToast />
            <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
            <div className="authgrid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000,transparent)] dark:[background-image:none]" aria-hidden="true" />
            <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-[120px] dark:bg-brand-600/20" aria-hidden="true" />
            <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-signal-500/15 blur-[110px] dark:bg-transparent" aria-hidden="true" />

            <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_40px_120px_-30px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-ink-900/70 dark:shadow-[0_40px_120px_-30px_rgba(109,63,234,0.45)] dark:backdrop-blur-xl md:grid-cols-2">
                {/* form column */}
                <div className="flex flex-col justify-center p-8 sm:p-12">
                    <Link href="/" className="inline-flex w-fit items-center gap-1" aria-label={brand}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={brand} className="h-8 w-auto max-w-[10rem] object-contain" />
                        ) : (
                            <>
                                <BrandMark variant="light" className="h-9 w-9 dark:hidden" />
                                <BrandMark variant="dark" className="hidden h-9 w-9 dark:block" />
                                <span className="font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-white"><BrandName brand={brand} /></span>
                            </>
                        )}
                    </Link>

                    {variant === 'admin' && (
                        <span className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-full border border-warm/30 bg-warm/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-warm">
                            <ShieldCheck className="h-3.5 w-3.5" /> Admin area · restricted
                        </span>
                    )}
                    {eyebrow && <span className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-signal-400 ${variant === 'admin' ? 'mt-3' : 'mt-8'}`}><span className="h-1.5 w-1.5 rounded-[2px] bg-signal-400" />{eyebrow}</span>}
                    <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">{title}</h1>
                    {subtitle && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>}

                    <div className="mt-7">{children}</div>

                    {footer && <div className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">{footer}</div>}

                    <Link href={route('home')} className="mt-8 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-400 transition">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
                    </Link>
                </div>

                <ConsolePanel variant={variant} />
            </div>
        </div>
    );
}
