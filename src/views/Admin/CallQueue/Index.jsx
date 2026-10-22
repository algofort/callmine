'use client';

import { route } from '@/lib/route';
import { Head, router } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { useTranslation } from 'react-i18next';
import { ListChecks, RotateCw, Trash2 } from 'lucide-react';

const STATUS = {
    pending: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300',
    scheduled: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
    processing: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    completed: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    failed: 'bg-danger/10 text-danger',
};

function Stat({ label, value, live }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
            <div className="flex items-center gap-2">
                {live && value > 0 && <span className="h-2 w-2 rounded-full bg-signal-400 animate-pulse-signal" />}
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
        </div>
    );
}

export default function CallQueueIndex({ jobs, filters = {}, stats = {} }) {
    const { t } = useTranslation();
    const filter = (status) => router.get(route('admin.call-queue.index'), status ? { status } : {}, { preserveState: true, replace: true });
    const retry = (j) => router.post(route('admin.call-queue.retry', j.id), {}, { preserveScroll: true });
    const cancel = (j) => { if (confirm('Remove this job from the queue?')) router.delete(route('admin.call-queue.cancel', j.id), { preserveScroll: true }); };

    return (
        <AdminLayout title={t('admin.call_queue') || 'Call Queue'}>
            <Head title="Call Queue" />
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                    <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">Call Queue</h2>
                </div>

                <PageOverview feature="admin-call-queue" />

                <div className="grid gap-3 sm:grid-cols-5">
                    <Stat label="Pending" value={stats.pending ?? 0} />
                    <Stat label="Scheduled" value={stats.scheduled ?? 0} />
                    <Stat label="Processing" value={stats.processing ?? 0} live />
                    <Stat label="Completed" value={stats.completed ?? 0} />
                    <Stat label="Failed" value={stats.failed ?? 0} />
                </div>

                <div className="flex gap-1.5">
                    {['', 'pending', 'scheduled', 'processing', 'completed', 'failed'].map((s) => (
                        <button key={s || 'all'} onClick={() => filter(s)} className={`rounded-soft px-3 py-1.5 text-xs font-medium capitalize ${(filters.status || '') === s ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{s || 'All'}</button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50">
                            <tr>{['Campaign', 'Customer', 'Contact', 'Status', 'Retries', 'Scheduled', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {jobs.data.map((j) => (
                                <tr key={j.id}>
                                    <td className="px-4 py-3 text-neutral-900 dark:text-white">{j.campaign || '—'}</td>
                                    <td className="px-4 py-3 text-neutral-500">{j.customer || '—'}</td>
                                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{j.contact}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[j.status] || STATUS.pending}`}>{j.status}</span>{j.last_error && <span className="ml-2 text-xs text-danger" title={j.last_error}>!</span>}</td>
                                    <td className="px-4 py-3 font-mono text-neutral-500">{j.attempts}/{j.max_retries}</td>
                                    <td className="px-4 py-3 text-neutral-500">{j.scheduled_for ? new Date(j.scheduled_for).toLocaleString() : '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-1">
                                            <button onClick={() => retry(j)} title="Requeue" className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><RotateCw className="h-4 w-4" /></button>
                                            <button onClick={() => cancel(j)} title="Remove" className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {jobs.data.length === 0 && <tr><td colSpan="7" className="px-4 py-10 text-center text-neutral-500">Queue is empty.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
