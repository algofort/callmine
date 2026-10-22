'use client';

import { Info } from 'lucide-react';
import MarketingLayout from '@/layouts/MarketingLayout';
import { Eyebrow } from '@/components/marketing/ui';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * Reusable legal document shell (Privacy / Terms) with a sticky table of contents.
 * `sections`: [{ h, body: (string | { list: string[] })[] }]
 */
export default function LegalDoc({ eyebrow, title, updated, intro, sections = [], metaTitle, description }) {
    return (
        <MarketingLayout title={metaTitle || `${title} — CallMineAI`} description={description}>
            <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40">
                <div className="grid-field grid-mask pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
                <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[120px]" aria-hidden="true" />
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Eyebrow>{eyebrow}</Eyebrow>
                    <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">{title}</h1>
                    {updated && <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">Last updated · {updated}</p>}
                    {intro && <p className="mt-5 max-w-2xl text-neutral-600 dark:text-neutral-400">{intro}</p>}
                    <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-warm/30 bg-warm/[0.08] px-4 py-3 text-sm text-amber-800 dark:text-amber-200/90">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
                        <p>This document is a professionally structured <span className="font-semibold">template</span>. Review and adapt it with qualified legal counsel to meet the laws of your jurisdiction before production use.</p>
                    </div>
                </div>
            </section>

            <section className="pb-24">
                <div className="mx-auto grid max-w-4xl gap-10 px-4 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
                    <nav aria-label="Contents" className="hidden lg:block">
                        <div className="sticky top-24">
                            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">On this page</p>
                            <ul className="mt-4 space-y-2 text-sm">
                                {sections.map((s) => (
                                    <li key={s.h}><a href={`#${slug(s.h)}`} className="text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white">{s.h}</a></li>
                                ))}
                            </ul>
                        </div>
                    </nav>

                    <div className="min-w-0 space-y-10">
                        {sections.map((s, i) => (
                            <div key={s.h} id={slug(s.h)} className="scroll-mt-24">
                                <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white"><span className="mr-2 font-mono text-sm text-brand-500 dark:text-brand-400">{String(i + 1).padStart(2, '0')}</span>{s.h}</h2>
                                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    {s.body.map((b, j) => typeof b === 'string'
                                        ? <p key={j}>{b}</p>
                                        : <ul key={j} className="space-y-2">{b.list.map((x) => <li key={x} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />{x}</li>)}</ul>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
