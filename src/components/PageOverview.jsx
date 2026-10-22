'use client';

import { FEATURE_OVERVIEWS } from '@/lib/featureOverviews';

const ACCENTS = {
    brand: { tile: 'from-brand-500 to-brand-300', ring: 'border-brand-200/70 dark:border-brand-500/20', wash: 'from-brand-50 dark:from-brand-500/10', glow: 'bg-brand-400/20', num: 'bg-brand-500' },
    signal: { tile: 'from-signal-500 to-signal-300', ring: 'border-signal-200/70 dark:border-signal-500/20', wash: 'from-signal-50 dark:from-signal-500/10', glow: 'bg-signal-400/20', num: 'bg-signal-500' },
    warm: { tile: 'from-warm to-amber-300', ring: 'border-amber-200/70 dark:border-amber-500/20', wash: 'from-amber-50 dark:from-amber-500/10', glow: 'bg-amber-400/20', num: 'bg-amber-500' },
    cold: { tile: 'from-cold to-sky-300', ring: 'border-sky-200/70 dark:border-sky-500/20', wash: 'from-sky-50 dark:from-sky-500/10', glow: 'bg-sky-400/20', num: 'bg-cold' },
};

/**
 * Branded feature-overview banner. Pass a `feature` key (looked up in
 * featureOverviews.js) or override any of icon/title/description/steps/accent.
 */
export default function PageOverview({ feature, icon, title, description, steps, accent, className = '' }) {
    const cfg = (feature && FEATURE_OVERVIEWS[feature]) || {};
    const Icon = icon || cfg.icon;
    const t = title || cfg.title;
    const desc = description || cfg.description;
    const list = steps || cfg.steps || [];
    const a = ACCENTS[accent || cfg.accent || 'brand'];
    if (!t) return null;

    return (
        <div className={`relative overflow-hidden rounded-soft-lg border bg-gradient-to-r to-white p-4 shadow-soft dark:to-ink-900 sm:p-5 ${a.ring} ${a.wash} ${className}`}>
            <div className={`pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl ${a.glow}`} />
            <div className="relative flex items-start gap-4">
                {Icon && (
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${a.tile}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold text-neutral-900 dark:text-white">{t}</h2>
                    {desc && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{desc}</p>}
                    {list.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {list.map((s, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-600 backdrop-blur dark:border-ink-700 dark:bg-ink-900/60 dark:text-neutral-300">
                                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${a.num}`}>{i + 1}</span>
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
