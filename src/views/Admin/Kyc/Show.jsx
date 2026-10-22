'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft, FileText, Check, X, Download } from 'lucide-react';

const KYC = { verified: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', pending: 'bg-warm/20 text-amber-700 dark:text-amber-300', rejected: 'bg-danger/10 text-danger', unverified: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800' };
const DOC = { approved: 'text-signal-600 dark:text-signal-400', rejected: 'text-danger', pending: 'text-amber-600 dark:text-amber-300' };

export default function KycShow({ client, documents = [], types = {} }) {
    const review = (d, status) => { const note = status === 'rejected' ? (prompt('Reason (optional):') || '') : ''; router.post(route('admin.kyc.review', d.id), { status, note }, { preserveScroll: true }); };
    const setStatus = (s) => router.post(route('admin.kyc.status', client.id), { kyc_status: s }, { preserveScroll: true });

    return (
        <AdminLayout title={`KYC · ${client.name}`}>
            <Head title={`KYC · ${client.name}`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Link href={route('admin.kyc.index')} className="rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /></Link><div><h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">{client.name}</h2><p className="text-sm text-neutral-500">{client.email}</p></div></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${KYC[client.kyc_status]}`}>{client.kyc_status}</span>
                </div>

                <div className="space-y-3">
                    {Object.entries(types).map(([type, label]) => {
                        const doc = documents.find((d) => d.type === type);
                        return (
                            <div key={type} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 text-neutral-400" /><div className="min-w-0"><p className="font-medium text-neutral-900 dark:text-white">{label}</p>{doc ? <p className="truncate text-xs text-neutral-400">{doc.original_name} · <span className={`capitalize ${DOC[doc.status]}`}>{doc.status}</span>{doc.note ? ` · ${doc.note}` : ''}</p> : <p className="text-xs text-neutral-400">Not uploaded</p>}</div></div>
                                    {doc && (
                                        <div className="flex shrink-0 gap-1.5">
                                            <a href={doc.url} className="rounded-soft border border-neutral-200 dark:border-ink-700 p-1.5 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-ink-800"><Download className="h-4 w-4" /></a>
                                            <button onClick={() => review(doc, 'approved')} className="rounded-soft bg-signal-500 p-1.5 text-white hover:bg-signal-600"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => review(doc, 'rejected')} className="rounded-soft bg-danger p-1.5 text-white hover:opacity-90"><X className="h-4 w-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4">
                    <span className="text-sm text-neutral-500">Override status:</span>
                    {['verified', 'rejected', 'pending', 'unverified'].map((s) => <button key={s} onClick={() => setStatus(s)} className="rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs capitalize text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800">{s}</button>)}
                </div>
            </div>
        </AdminLayout>
    );
}
