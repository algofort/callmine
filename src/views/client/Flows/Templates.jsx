'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import { Target, Phone, MessageSquare, RefreshCw, LayoutTemplate, ArrowLeft, GitBranch, Zap, ArrowRight } from 'lucide-react';

const ICONS = { target: Target, phone: Phone, message: MessageSquare, refresh: RefreshCw };
const ACCENTS = {
    brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
    signal: 'bg-signal-500/15 text-signal-600 dark:text-signal-300',
    warm: 'bg-warm/15 text-amber-600 dark:text-amber-300',
    cold: 'bg-cold/15 text-cold',
};
const TRIGGER_LABEL = {
    manual: 'Manual', call_completed: 'Call completed', inbound_call: 'Inbound call',
    lead_qualified: 'Lead qualified', schedule: 'Schedule',
};

export default function FlowTemplates({ templates = [] }) {
    const use = (key) => router.post(route('client.flows.templates.use', key));

    return (
        <ClientLayout title="Flow Templates">
            <Head title="Flow Templates" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Templates</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Proven automations you can clone and customize in seconds.</p>
                    </div>
                    <Link href={route('client.flows.index')} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /> Back to flows</Link>
                </div>

                <PageOverview feature="flow-templates" />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tpl) => {
                        const Icon = ICONS[tpl.icon] || LayoutTemplate;
                        const steps = tpl.definition?.nodes ?? [];
                        return (
                            <div key={tpl.key} className="flex flex-col rounded-soft-lg border border-neutral-200 bg-white p-5 shadow-soft transition hover:shadow-soft-lg dark:border-ink-800 dark:bg-ink-900">
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${ACCENTS[tpl.accent] || ACCENTS.brand}`}><Icon className="h-5 w-5" /></span>
                                    <div>
                                        <h3 className="font-display font-semibold text-neutral-900 dark:text-white">{tpl.name}</h3>
                                        <span className="inline-flex items-center gap-1 text-xs text-neutral-400"><Zap className="h-3 w-3" /> {TRIGGER_LABEL[tpl.trigger_type] || tpl.trigger_type}</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{tpl.description}</p>
                                <div className="mt-4 space-y-1.5">
                                    {steps.map((n, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500 dark:bg-ink-800 dark:text-neutral-400">{i + 1}</span>
                                            <span className="truncate">{n.data?.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-ink-800">
                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400"><GitBranch className="h-3.5 w-3.5" /> {steps.length} steps</span>
                                    <button onClick={() => use(tpl.key)} className="inline-flex items-center gap-1.5 rounded-soft bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">Use template <ArrowRight className="h-4 w-4" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ClientLayout>
    );
}
