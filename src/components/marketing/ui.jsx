'use client';

import { useEffect, useRef, useState } from 'react';

/* Shared motion + primitives for the marketing site. Injected once by MarketingLayout. */
export const MARKETING_STYLES = `
:root{--iris:#6d3fea;--iris2:#8a67f2;--signal:#16d9a8}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.on{opacity:1;transform:none}
.grid-field{background-image:linear-gradient(to right,rgba(12,12,28,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(12,12,28,.05) 1px,transparent 1px);background-size:60px 60px}
.dark .grid-field{background-image:linear-gradient(to right,rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.05) 1px,transparent 1px)}
.grid-mask{-webkit-mask-image:radial-gradient(ellipse 75% 60% at 50% 0%,#000 35%,transparent 100%);mask-image:radial-gradient(ellipse 75% 60% at 50% 0%,#000 35%,transparent 100%)}
/* fade in below the nav, out toward the content — plus a soft radial vignette so the grid dissolves at the edges */
.hero-grid-mask{-webkit-mask-image:radial-gradient(120% 90% at 50% 30%,#000 0%,#000 45%,transparent 78%),linear-gradient(to bottom,transparent 0%,#000 16%,#000 60%,transparent 92%);-webkit-mask-composite:source-in;mask-image:radial-gradient(120% 90% at 50% 30%,#000 0%,#000 45%,transparent 78%),linear-gradient(to bottom,transparent 0%,#000 16%,#000 60%,transparent 92%);mask-composite:intersect}
/* Light-mode atmosphere: ambient mesh canvas, tinted section washes, light beam. Dark reverts. */
.mk-canvas{background-color:#f6f6fb;background-image:radial-gradient(60rem 42rem at 50% 6%,rgba(109,63,234,.10),transparent 60%),radial-gradient(40rem 32rem at 100% 12%,rgba(22,217,168,.08),transparent 55%),radial-gradient(46rem 40rem at -6% 34%,rgba(138,103,242,.07),transparent 55%),radial-gradient(40rem 40rem at 100% 92%,rgba(79,176,255,.06),transparent 55%)}
.dark .mk-canvas{background-color:#0c0c1c;background-image:none}
.mk-wash{background-color:#f0f0f8;background-image:linear-gradient(180deg,rgba(109,63,234,.06),rgba(240,240,248,0) 55%),linear-gradient(0deg,rgba(22,217,168,.04),rgba(240,240,248,0) 45%)}
.dark .mk-wash{background-color:rgba(255,255,255,.015);background-image:none}
.mk-beam{background:conic-gradient(from 128deg at 50% -2%,transparent 0deg,rgba(109,63,234,.12) 42deg,rgba(22,217,168,.09) 74deg,transparent 116deg)}
.dark .mk-beam{background:none}
.mk-card-lift{box-shadow:0 1px 2px rgba(16,24,40,.04),0 18px 40px -20px rgba(16,24,40,.16)}
.dark .mk-card-lift{box-shadow:none}
@keyframes wave{0%,100%{transform:scaleY(.22)}50%{transform:scaleY(1)}}
.wbar{width:3px;border-radius:9px;transform-origin:bottom;background:linear-gradient(to top,var(--iris),var(--signal));animation:wave 1s ease-in-out infinite}
@keyframes caret{0%,100%{opacity:1}50%{opacity:0}}
.caret{animation:caret 1s step-end infinite}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.floaty{animation:floaty 4s ease-in-out infinite}.floaty.d1{animation-delay:.8s}.floaty.d2{animation-delay:1.6s}
@keyframes marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.marq{animation:marq 34s linear infinite}
@keyframes sweep{from{width:0}}
.sweep{animation:sweep 1.4s cubic-bezier(.16,1,.3,1) both}
@keyframes drawline{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.sheen{position:relative;overflow:hidden}
.sheen::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%);transform:translateX(-120%);transition:transform .7s}
.sheen:hover::after{transform:translateX(120%)}
html{scroll-behavior:smooth}
body{transition:background-color .35s ease}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .reveal{opacity:1;transform:none;transition:none}
  .wbar,.caret,.floaty,.marq,.sweep{animation:none!important}.sheen::after{display:none}
}
`;

function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [on, setOn] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold, rootMargin: '0px 0px -8% 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);
    return [ref, on];
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
    const [ref, on] = useInView(0.12);
    return <Tag ref={ref} className={`reveal ${on ? 'on' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

export function Eyebrow({ children, className = '' }) {
    return (
        <span className={`inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-signal-600 dark:text-signal-400 ${className}`}>
            <span className="h-1.5 w-1.5 rounded-[2px] bg-signal-500 dark:bg-signal-400" aria-hidden="true" />{children}
        </span>
    );
}

export function WaveBars({ count = 44, className = '', h = 'h-12' }) {
    return (
        <div className={`flex items-end gap-[3px] ${h} ${className}`} aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="wbar h-full" style={{ animationDelay: `${(i % 14) * 70}ms`, animationDuration: `${820 + (i % 6) * 130}ms`, opacity: 0.5 + ((i % 6) / 10) }} />
            ))}
        </div>
    );
}

/** Counts up the numeric part of a value (e.g. "12,000+", "99.9%") when scrolled into view. */
export function Counter({ value, className = '' }) {
    const [ref, on] = useInView(0.4);
    const [disp, setDisp] = useState(String(value));
    useEffect(() => {
        const raw = String(value);
        const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const m = raw.match(/^([^\d]*)([\d,.]+)(.*)$/);
        if (!on || reduce || !m || raw.includes(':')) { setDisp(raw); return; }
        const [, pre, numStr, suf] = m;
        const target = parseFloat(numStr.replace(/,/g, ''));
        const decimals = (numStr.split('.')[1] || '').length;
        const dur = 1200; const start = performance.now();
        let frame;
        const tick = (t) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const cur = target * eased;
            setDisp(pre + cur.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suf);
            if (p < 1) frame = requestAnimationFrame(tick); else setDisp(raw);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [on, value]);
    return <span ref={ref} className={className}>{disp}</span>;
}

export function SectionHead({ eyebrow, title, sub, center = false, className = '' }) {
    return (
        <div className={`${center ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}>
            {eyebrow && <Eyebrow className={center ? 'justify-center' : ''}>{eyebrow}</Eyebrow>}
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">{title}</h2>
            {sub && <p className="mt-3 text-neutral-600 dark:text-neutral-400">{sub}</p>}
        </div>
    );
}
