'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { Head, Link, router } from '@/lib/page-router';
import { Phone, AudioLines, CheckCircle2, XCircle, ArrowRight, Settings2 } from 'lucide-react';

function StatusBadge({ ok, okText, badText }) {
    return ok
        ? <span className="inline-flex items-center gap-1 rounded-full bg-signal-100 px-2 py-0.5 text-[11px] font-medium text-signal-700 dark:bg-signal-500/20 dark:text-signal-300"><CheckCircle2 className="h-3 w-3" /> {okText}</span>
        : <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-ink-800 dark:text-neutral-400"><XCircle className="h-3 w-3" /> {badText}</span>;
}

export default function EnginesIndex({ providers = [], engines = [] }) {
    const toggleEngine = (eng, enabled) => router.put(route('admin.engines.toggle', eng.key), { enabled }, { preserveScroll: true });

    return (
        <AdminLayout title="Engines">
            <Head title="Engines" />
            <div className="space-y-6">
                <div>
                    <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Calling Engines</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure every telephony + voice provider in one place, and choose which engines customers can use.</p>
                </div>

                <PageOverview feature="admin-engines" />

                {/* Provider cards → each opens its own config page */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Providers</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {providers.map((p) => {
                            const Icon = p.kind === 'telephony' ? Phone : AudioLines;
                            return (
                                <Link key={p.key} href={route('admin.engines.show', p.key)} className="group flex flex-col rounded-soft-lg border border-neutral-200 bg-white p-5 shadow-soft transition hover:border-brand-300 hover:shadow-soft-lg dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-500/40">
                                    <div className="flex items-start justify-between">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300"><Icon className="h-5 w-5" /></span>
                                        {p.enabled ? null : <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-ink-800">Disabled</span>}
                                    </div>
                                    <h4 className="mt-3 font-display font-semibold text-neutral-900 dark:text-white">{p.label}</h4>
                                    <p className="text-xs capitalize text-neutral-400">{p.kind} provider</p>
                                    <div className="mt-3"><StatusBadge ok={p.configured} okText="Configured" badText="Not configured" /></div>
                                    {p.summary && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{p.summary}</p>}
                                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400"><Settings2 className="h-4 w-4" /> Configure <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Engine availability */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Engines</h3>
                    <div className="overflow-hidden rounded-soft-lg border border-neutral-200 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900">
                        <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Engine', 'Voice', 'Telephony', 'Status', 'Available to customers'].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {engines.map((e) => (
                                    <tr key={e.key}>
                                        <td className="px-5 py-3"><span className="inline-flex items-center gap-2 font-medium text-neutral-900 dark:text-white"><span className="h-2.5 w-2.5 rounded-full" style={{ background: e.dot }} />{e.label}</span></td>
                                        <td className="px-5 py-3 capitalize text-neutral-500">{e.voice}</td>
                                        <td className="px-5 py-3 capitalize text-neutral-500">{e.telephony}</td>
                                        <td className="px-5 py-3"><StatusBadge ok={e.configured} okText="Ready" badText="Missing creds" /></td>
                                        <td className="px-5 py-3">
                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                <input type="checkbox" checked={e.enabled} onChange={(ev) => toggleEngine(e, ev.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
                                                <span className="text-xs text-neutral-500">{e.enabled ? 'Enabled' : 'Disabled'}</span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-xs text-neutral-400">Disabled engines are hidden from the customer agent form. A "Missing creds" engine still shows to customers but calls fail until its providers are configured.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
