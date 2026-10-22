'use client';

import { route } from '@/lib/route';
import { Head, Link } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { ArrowLeft, CheckCircle2, XCircle, Loader, Circle, MinusCircle, Zap, GitBranch, Play, Clock } from 'lucide-react';

const EXEC_STATUS = {
    completed: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    failed: 'bg-danger/10 text-danger',
    running: 'bg-warm/20 text-amber-700 dark:text-amber-300',
};
const STEP_ICON = {
    completed: { icon: CheckCircle2, cls: 'text-signal-500' },
    failed: { icon: XCircle, cls: 'text-danger' },
    running: { icon: Loader, cls: 'text-amber-500' },
    skipped: { icon: MinusCircle, cls: 'text-neutral-400' },
    pending: { icon: Circle, cls: 'text-neutral-300' },
};
const CAT_ICON = { trigger: Zap, condition: GitBranch, action: Play };
const fmtDur = (ms) => ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

export default function ExecutionShow({ execution }) {
    const steps = execution.steps || [];
    return (
        <ClientLayout title="Execution detail">
            <Head title={`Execution #${execution.id}`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <Link href={route('client.flows.executions.index')} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><ArrowLeft className="h-4 w-4" /> Execution logs</Link>

                {/* Header */}
                <div className="rounded-soft-lg border border-neutral-200 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-white">{execution.flow}</h1>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${EXEC_STATUS[execution.status] || EXEC_STATUS.running}`}>{execution.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-neutral-400">Execution #{execution.id} · triggered {execution.trigger_source?.replace('_', ' ')}</p>
                        </div>
                        <Link href={route('client.flows.edit', execution.flow_id)} className="rounded-soft border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800">Open flow</Link>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-soft border border-neutral-200 px-3 py-2 dark:border-ink-800"><p className="text-[11px] uppercase text-neutral-400">Duration</p><p className="font-display font-semibold text-neutral-900 dark:text-white">{fmtDur(execution.duration_ms)}</p></div>
                        <div className="rounded-soft border border-neutral-200 px-3 py-2 dark:border-ink-800"><p className="text-[11px] uppercase text-neutral-400">Steps</p><p className="font-display font-semibold text-neutral-900 dark:text-white">{steps.length}</p></div>
                        <div className="rounded-soft border border-neutral-200 px-3 py-2 dark:border-ink-800"><p className="text-[11px] uppercase text-neutral-400">Started</p><p className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">{execution.started_at ? fmtTime(execution.started_at) : '—'}</p></div>
                    </div>
                    {execution.error && <div className="mt-3 rounded-soft bg-danger/10 px-3 py-2 text-sm text-danger">{execution.error}</div>}
                </div>

                {/* Step timeline */}
                <div className="rounded-soft-lg border border-neutral-200 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
                    <h3 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Steps</h3>
                    <ol className="relative space-y-4 border-l border-neutral-200 pl-6 dark:border-ink-700">
                        {steps.map((s) => {
                            const si = STEP_ICON[s.status] || STEP_ICON.pending;
                            const StepIcon = si.icon;
                            const Cat = CAT_ICON[s.type] || Play;
                            return (
                                <li key={s.id} className="relative">
                                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-ink-900"><StepIcon className={`h-5 w-5 ${si.cls}`} /></span>
                                    <div className="flex items-start gap-2">
                                        <Cat className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{s.label}</p>
                                            {s.message && <p className="text-xs text-neutral-500">{s.message}</p>}
                                        </div>
                                        <span className="ml-auto text-[11px] capitalize text-neutral-400">{s.status}</span>
                                    </div>
                                </li>
                            );
                        })}
                        {steps.length === 0 && <li className="text-sm text-neutral-400">No steps recorded.</li>}
                    </ol>
                </div>
            </div>
        </ClientLayout>
    );
}
