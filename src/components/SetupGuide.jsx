'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink, AlertTriangle } from 'lucide-react';
import { INTEGRATION_GUIDES } from '@/lib/integrationGuides';

/**
 * Collapsible per-integration setup guide. Pass a `guide` key defined in
 * lib/integrationGuides.js. Renders numbered steps (with optional external
 * links) and any gotcha notes. Collapsed by default.
 */
export default function SetupGuide({ guide, defaultOpen = false, className = '' }) {
    const g = INTEGRATION_GUIDES[guide];
    const [open, setOpen] = useState(defaultOpen);
    if (!g) return null;

    return (
        <div className={`overflow-hidden rounded-soft-lg border border-brand-200/70 bg-brand-50/50 dark:border-brand-500/20 dark:bg-brand-500/[0.06] ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={open}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-300">
                    <BookOpen className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-medium text-neutral-900 dark:text-white">Setup guide: {g.title}</span>
                    {g.intro && <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{g.intro}</span>}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="space-y-4 border-t border-brand-200/50 px-4 py-4 dark:border-brand-500/15">
                    {g.intro && <p className="text-sm text-neutral-600 dark:text-neutral-300">{g.intro}</p>}

                    <ol className="space-y-2.5">
                        {g.steps.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">{i + 1}</span>
                                <span className="min-w-0">
                                    {s.text}
                                    {s.href && (
                                        <a href={s.href} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                                            {s.linkText || 'Open'} <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                    {s.code && <code className="ml-1 rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs text-neutral-700 dark:bg-ink-800 dark:text-neutral-300">{s.code}</code>}
                                </span>
                            </li>
                        ))}
                    </ol>

                    {(g.notes || []).map((n, i) => (
                        <div key={i} className="flex gap-2 rounded-soft border border-warm/30 bg-warm/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{n}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
