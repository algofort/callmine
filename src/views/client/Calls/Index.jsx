'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router } from '@/lib/page-router';
import axios from 'axios';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination, AudioPlayer } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Search, Download, RefreshCw, X, FileText, Play } from 'lucide-react';

const SENTIMENT = { positive: 'text-signal-600 dark:text-signal-400', neutral: 'text-neutral-500', negative: 'text-danger' };
const QUAL = { hot: 'bg-hot/15 text-hot', warm: 'bg-warm/20 text-amber-700 dark:text-amber-300', cold: 'bg-cold/15 text-cold', unqualified: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800' };
const STATUS = { completed: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', failed: 'bg-danger/10 text-danger', no_answer: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800', busy: 'bg-warm/20 text-amber-700 dark:text-amber-300' };

function fmtDur(s) { if (!s) return '0:00'; const m = Math.floor(s / 60), r = s % 60; return `${m}:${String(r).padStart(2, '0')}`; }

function DetailModal({ callId, onClose }) {
    const [data, setData] = useState(null);
    if (!data && callId) axios.get(route('client.calls.show', callId)).then((r) => setData(r.data)).catch(() => setData({ error: true }));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Call detail</h3><button onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                {!data ? <p className="py-8 text-center text-sm text-neutral-400">Loading…</p> : (
                    <div className="space-y-4">
                        {data.recording_url && <AudioPlayer src={data.recording_url} filename={`call-${callId}.mp3`} />}
                        {data.summary && <div className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-neutral-50 dark:bg-ink-800/50 p-3 text-sm"><p className="mb-1 text-xs font-medium uppercase text-neutral-500">Summary</p>{data.summary}</div>}
                        <div className="flex gap-4 text-sm">
                            {data.sentiment && <span>Sentiment: <span className={SENTIMENT[data.sentiment]}>{data.sentiment}</span></span>}
                            {data.qualification && <span>Lead: <span className={`rounded-full px-2 py-0.5 text-xs ${QUAL[data.qualification]}`}>{data.qualification}</span></span>}
                            <span className="text-neutral-500">Duration: {fmtDur(data.duration_seconds)}</span>
                        </div>
                        <div><p className="mb-1 text-xs font-medium uppercase text-neutral-500">Transcript</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-soft border border-neutral-200 dark:border-ink-700 bg-neutral-50 dark:bg-ink-800/50 p-3 text-sm text-neutral-700 dark:text-neutral-300">{data.transcript || 'No transcript available.'}</pre></div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CallsIndex({ calls, filters = {}, stats = [] }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [detail, setDetail] = useState(null);

    const go = (extra) => router.get(route('client.calls.index'), { ...filters, search, ...extra }, { preserveState: true, replace: true });
    const sync = () => router.post(route('client.calls.sync-recordings'), {}, { preserveScroll: true });

    return (
        <ClientLayout title={t('nav.calls') !== 'nav.calls' ? t('nav.calls') : 'Calls'}>
            <Head title="Calls" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Calls & Conversations</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Transcripts, recordings, summaries and sentiment.</p></div>
                    <div className="flex gap-2">
                        <button onClick={sync} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><RefreshCw className="h-4 w-4" /> Sync recordings</button>
                        <a href={route('client.calls.export')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Download className="h-4 w-4" /> Export CSV</a>
                    </div>
                </div>

                <PageOverview feature="calls" />
                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1.5">
                        {[['', 'All'], ['transcribed', 'Transcribed'], ['recordings', 'With Recordings']].map(([v, l]) => (
                            <button key={v || 'all'} onClick={() => go({ tab: v })} className={`rounded-soft px-3 py-1.5 text-xs font-medium ${(filters.tab || '') === v ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{l}</button>
                        ))}
                    </div>
                    <select value={filters.sentiment || ''} onChange={(e) => go({ sentiment: e.target.value })} className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 px-3 pr-8 text-sm"><option value="">All sentiment</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option></select>
                    <form onSubmit={(e) => { e.preventDefault(); go(); }} className="relative flex-1 min-w-[180px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transcripts & summaries…" className="w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm" /></form>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50"><tr>{['Contact', 'Campaign', 'Status', 'Sentiment', 'Lead', 'Duration', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {calls.data.map((c) => (
                                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-ink-800/40">
                                    <td className="px-4 py-3"><p className="font-medium text-neutral-900 dark:text-white">{c.contact || '—'}</p><p className="font-mono text-xs text-neutral-400">{c.phone_masked}</p></td>
                                    <td className="px-4 py-3 text-neutral-500">{c.campaign || '—'}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[c.status] || 'bg-neutral-100 text-neutral-500 dark:bg-ink-800'}`}>{c.status?.replace('_', ' ')}</span></td>
                                    <td className={`px-4 py-3 capitalize ${SENTIMENT[c.sentiment] || 'text-neutral-400'}`}>{c.sentiment || '—'}</td>
                                    <td className="px-4 py-3">{c.qualification ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${QUAL[c.qualification]}`}>{c.qualification}</span> : '—'}</td>
                                    <td className="px-4 py-3 font-mono text-neutral-500">{fmtDur(c.duration_seconds)}</td>
                                    <td className="px-4 py-3 text-right"><button onClick={() => setDetail(c.id)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800">{c.has_transcript ? <FileText className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} View</button></td>
                                </tr>
                            ))}
                            {calls.data.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-neutral-500"><PhoneCall className="mx-auto mb-2 h-10 w-10 text-neutral-300" />No calls yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <Pagination data={calls} />
            </div>

            {detail && <DetailModal callId={detail} onClose={() => setDetail(null)} />}
        </ClientLayout>
    );
}
