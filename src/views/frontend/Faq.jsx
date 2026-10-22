'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Link } from '@/lib/page-router';
import { Plus, ArrowRight, Mail } from 'lucide-react';
import MarketingLayout from '@/layouts/MarketingLayout';
import { Eyebrow } from '@/components/marketing/ui';
import { FAQ_GROUPS, FAQ_FLAT } from '@/components/marketing/faqData';

function Item({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-neutral-200 last:border-0 dark:border-white/10">
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 py-4 text-left" aria-expanded={open}>
                <span className="font-medium text-neutral-900 dark:text-white">{q}</span>
                <span className={`shrink-0 rounded-md border border-neutral-200 p-1 text-neutral-500 transition dark:border-white/10 dark:text-neutral-400 ${open ? 'rotate-45 text-brand-500 dark:text-brand-300' : ''}`}><Plus className="h-3.5 w-3.5" /></span>
            </button>
            {open && <p className="pb-5 pr-8 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{a}</p>}
        </div>
    );
}

export default function Faq() {
    const schema = {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ_FLAT.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    };

    return (
        <MarketingLayout title="FAQ — CallMineAI" description="Answers to common pre-sales questions about installation, licensing, deployment, integrations, security, billing and support for the AI voice-calling platform." schema={schema}>
            <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40">
                <div className="grid-field grid-mask pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
                <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-[120px] dark:bg-brand-600/15" aria-hidden="true" />
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <Eyebrow className="justify-center">Frequently asked</Eyebrow>
                    <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">Questions, answered.</h1>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Everything you need to know before you buy — installation, licensing, integrations, security and support. Can’t find it? <a href="mailto:hello@callmineai.com" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Email us</a>.</p>
                </div>
            </section>

            <section className="pb-20">
                <div className="mx-auto max-w-3xl space-y-12 px-4 sm:px-6 lg:px-8">
                    {FAQ_GROUPS.map((g) => (
                        <div key={g.group}>
                            <h2 className="font-mono text-[11px] uppercase tracking-widest text-signal-600 dark:text-signal-400">{g.group}</h2>
                            <div className="mt-3 rounded-2xl border border-neutral-200 bg-white px-5 shadow-soft dark:border-white/10 dark:bg-ink-900/50 dark:shadow-none">
                                {g.items.map((f) => <Item key={f.q} q={f.q} a={f.a} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-4 pb-24 sm:px-6 lg:px-8">
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 px-8 py-12 text-center">
                    <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Still have a question?</h2>
                    <p className="mx-auto mt-3 max-w-lg text-brand-100/90">Our team is happy to help with anything installation, licensing or product-related.</p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        <a href="mailto:hello@callmineai.com" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"><Mail className="h-4 w-4" /> Contact support</a>
                        <Link href={route('register')} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Get started <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
