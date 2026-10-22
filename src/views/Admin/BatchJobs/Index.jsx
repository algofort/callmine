'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination } from '@/components/ui';
import { Layers, Search, Pause, Play } from 'lucide-react';

const STATUS = {
    active: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    paused: 'bg-warm/20 text-amber-700 dark:text-amber-300',
    completed: 'bg-cold/15 text-cold',
    draft: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800 dark:text-neutral-400',
};

export default function BatchJobsIndex({ batches, filters = {}, clients = [], statuses = [], stats = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const set = (patch) => router.get(route('admin.batch-jobs.index'), { ...filters, ...patch }, { preserveState: true, replace: true });
    const submit = (e) => { e.preventDefault(); set({ search }); };
    const pause = (b) => router.post(route('admin.batch-jobs.pause', b.id), {}, { preserveScroll: true });
    const resume = (b) => router.post(route('admin.batch-jobs.resume', b.id), {}, { preserveScroll: true });

    return (
        <AdminLayout title="Batch Jobs">
            <Head title="Batch Jobs" />
            <div className="space-y-5">
                <div>
                    <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Batch Jobs</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Bulk calling batches across all customers, with live progress.</p>
                </div>

                <PageOverview feature="admin-batch-jobs" />
                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={submit} className="relative max-w-xs flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batches…" className="w-full rounded-soft border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-ink-700 dark:bg-ink-900" />
                    </form>
                    <select value={filters.status || ''} onChange={(e) => set({ status: e.target.value })} className="rounded-soft border border-neutral-200 bg-white px-3 pr-8 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All statuses</option>
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filters.client || ''} onChange={(e) => set({ client: e.target.value })} className="rounded-soft border border-neutral-200 bg-white px-3 pr-8 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All customers</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900">
                    {batches.data.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Batch', 'Customer', 'Status', 'Progress', 'Calls', 'Success', ''].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {batches.data.map((b) => (
                                    <tr key={b.id}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Layers className="h-4 w-4" /></span>
                                                <span className="font-medium text-neutral-900 dark:text-white">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{b.client}</td>
                                        <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS[b.status] || STATUS.draft}`}>{b.status}</span></td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100 dark:bg-ink-800"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${b.progress}%` }} /></div>
                                                <span className="font-mono text-xs text-neutral-500">{b.progress}%</span>
                                            </div>
                                            <span className="text-[11px] text-neutral-400">{b.completed} done · {b.failed} failed · {b.contacts} contacts</span>
                                        </td>
                                        <td className="px-5 py-3 font-mono text-neutral-500">{b.calls}</td>
                                        <td className="px-5 py-3"><span className={b.success_rate >= 50 ? 'text-signal-600 dark:text-signal-400' : 'text-neutral-500'}>{b.success_rate}%</span></td>
                                        <td className="px-5 py-3 text-right">
                                            {b.status === 'active' && <button onClick={() => pause(b)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><Pause className="h-3.5 w-3.5" /> Pause</button>}
                                            {b.status === 'paused' && <button onClick={() => resume(b)} className="inline-flex items-center gap-1 rounded-soft bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300"><Play className="h-3.5 w-3.5" /> Resume</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><Layers className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No batches yet.</p></div>
                    )}
                </div>

                <Pagination data={batches} />
            </div>
        </AdminLayout>
    );
}
