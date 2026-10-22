'use client';

import { route } from '@/lib/route';
import { Link } from '@/lib/page-router';
import { ArrowRight, PenLine } from 'lucide-react';
import MarketingLayout from '@/layouts/MarketingLayout';
import { Eyebrow } from '@/components/marketing/ui';

export default function Blog() {
    return (
        <MarketingLayout title="Blog — CallMineAI" description="Product updates, guides and playbooks for running AI voice-calling campaigns at scale.">
            <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
                <div className="grid-field grid-mask pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
                <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-[120px] dark:bg-brand-600/15" aria-hidden="true" />
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <Eyebrow className="justify-center">Blog</Eyebrow>
                    <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">Playbooks for AI-powered outbound.</h1>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Guides, product updates and field notes on running voice agents at scale.</p>
                </div>
            </section>

            <section className="pb-24">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-soft dark:border-white/12 dark:bg-ink-900/40 dark:shadow-none">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/12 text-brand-500 dark:text-brand-300"><PenLine className="h-6 w-6" /></span>
                        <h2 className="mt-4 font-display text-lg font-semibold text-neutral-900 dark:text-white">No posts yet</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">Articles will appear here once a CMS or backend is wired up. In the meantime, jump straight into the product.</p>
                        <Link href={route('register')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500">Get started <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
