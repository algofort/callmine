'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination } from '@/components/ui';
import { ListChecks, CheckCircle2, XCircle, Loader, ArrowRight } from 'lucide-react';

const STATUS = {
    completed: { cls: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', icon: CheckCircle2 },
    failed: { cls: 'bg-danger/10 text-danger', icon: XCircle },
    running: { cls: 'bg-warm/20 text-amber-700 dark:text-amber-300', icon: Loader },
};
const fmtDur = (ms) => ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };

export default function ExecutionsIndex({ executions, filters = {}, stats = [] }) {
    const setStatus = (status) => router.get(route('client.flows.executions.index'), { status, flow: filters.flow }, { preserveState: true, replace: true });

    return (
        <ClientLayout title="Execution Logs">
            <Head title="Execution Logs" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Execution Logs</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Every flow run, with per-step results.</p>
                    </div>
                    <Link href={route('client.flows.index')} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800">Back to flows</Link>
                </div>

                <PageOverview feature="flow-executions" />
                <StatCards items={stats} />

                <div className="flex gap-2">
                    <select value={filters.status || ''} onChange={(e) => setStatus(e.target.value)} className="rounded-soft border border-neutral-200 bg-white px-3 pr-8 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All statuses</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="running">Running</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900">
                    {executions.data.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Flow', 'Status', 'Trigger', 'Duration', 'Started', ''].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {executions.data.map((e) => {
                                    const s = STATUS[e.status] || STATUS.running;
                                    const Icon = s.icon;
                                    return (
                                        <tr key={e.id} className="transition hover:bg-neutral-50/70 dark:hover:bg-ink-800/40">
                                            <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">{e.flow}</td>
                                            <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] capitalize ${s.cls}`}><Icon className="h-3 w-3" /> {e.status}</span></td>
                                            <td className="px-5 py-3 capitalize text-neutral-500">{(e.trigger_source || '').replace('_', ' ')}</td>
                                            <td className="px-5 py-3 font-mono text-neutral-500">{fmtDur(e.duration_ms)}</td>
                                            <td className="px-5 py-3 text-neutral-500">{e.started_at ? fmtTime(e.started_at) : '—'}</td>
                                            <td className="px-5 py-3 text-right"><Link href={route('client.flows.executions.show', e.id)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">View <ArrowRight className="h-3 w-3" /></Link></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><ListChecks className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No executions yet. Run a flow to see logs here.</p></div>
                    )}
                </div>

                <Pagination data={executions} />
            </div>
        </ClientLayout>
    );
}
