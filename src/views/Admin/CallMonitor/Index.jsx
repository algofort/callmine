'use client';

import { route } from '@/lib/route';
import { useEffect, useState } from 'react';
import { Head, router } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination } from '@/components/ui';
import { PhoneCall, RadioTower, Pause, Play } from 'lucide-react';

const STATUS = {
    ringing: 'bg-warm/20 text-amber-700 dark:text-amber-300',
    in_progress: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    queued: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800',
    completed: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    failed: 'bg-danger/10 text-danger',
    no_answer: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800',
    busy: 'bg-warm/20 text-amber-700 dark:text-amber-300',
};
const SENT = { positive: 'text-signal-600 dark:text-signal-400', neutral: 'text-neutral-500', negative: 'text-danger' };
const fmtDur = (s) => s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return '—'; } };

export default function CallMonitorIndex({ calls, filters = {}, clients = [], statuses = [], stats = [] }) {
    const [auto, setAuto] = useState(true);
    const set = (patch) => router.get(route('admin.call-monitoring.index'), { ...filters, ...patch }, { preserveState: true, replace: true });

    useEffect(() => {
        if (!auto) return;
        const id = setInterval(() => router.reload({ only: ['calls', 'stats'], preserveScroll: true }), 5000);
        return () => clearInterval(id);
    }, [auto]);

    return (
        <AdminLayout title="Call Monitoring">
            <Head title="Call Monitoring" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Call Monitoring</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Live and recent calls across every customer.</p>
                    </div>
                    <button onClick={() => setAuto((v) => !v)} className={`inline-flex items-center gap-2 rounded-soft border px-3 py-2 text-sm font-medium transition ${auto ? 'border-signal-300 bg-signal-50 text-signal-700 dark:border-signal-500/30 dark:bg-signal-500/10 dark:text-signal-300' : 'border-neutral-200 text-neutral-600 dark:border-ink-700 dark:text-neutral-300'}`}>
                        {auto ? <><RadioTower className="h-4 w-4 animate-pulse" /> Live · auto-refresh</> : <><Play className="h-4 w-4" /> Paused</>}
                    </button>
                </div>

                <PageOverview feature="admin-call-monitoring" />
                <StatCards items={stats} />

                <div className="flex flex-wrap gap-2">
                    <select value={filters.status || ''} onChange={(e) => set({ status: e.target.value })} className="rounded-soft border border-neutral-200 bg-white px-3 pr-8 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All statuses</option>
                        {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <select value={filters.client || ''} onChange={(e) => set({ client: e.target.value })} className="rounded-soft border border-neutral-200 bg-white px-3 pr-8 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All customers</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900">
                    {calls.data.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Customer', 'Agent', 'Contact', 'Status', 'Sentiment', 'Engine', 'Duration', 'Started'].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {calls.data.map((c) => (
                                    <tr key={c.id} className={c.live ? 'bg-signal-50/50 dark:bg-signal-500/5' : ''}>
                                        <td className="px-5 py-2.5 font-medium text-neutral-900 dark:text-white">{c.client}</td>
                                        <td className="px-5 py-2.5 text-neutral-600 dark:text-neutral-300">{c.agent}</td>
                                        <td className="px-5 py-2.5 font-mono text-neutral-500">{c.phone}</td>
                                        <td className="px-5 py-2.5">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS[c.status] || STATUS.queued}`}>
                                                {c.live && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}{(c.status || '').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-2.5 capitalize ${SENT[c.sentiment] || 'text-neutral-400'}`}>{c.sentiment || '—'}</td>
                                        <td className="px-5 py-2.5 text-neutral-500">{c.engine || '—'}</td>
                                        <td className="px-5 py-2.5 font-mono text-neutral-500">{fmtDur(c.duration_seconds)}</td>
                                        <td className="px-5 py-2.5 text-neutral-500">{c.started_at ? fmtTime(c.started_at) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><PhoneCall className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No calls to monitor.</p></div>
                    )}
                </div>

                <Pagination data={calls} />
            </div>
        </AdminLayout>
    );
}
