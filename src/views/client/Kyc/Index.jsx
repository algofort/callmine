'use client';

import { route } from '@/lib/route';
import { Head, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import FileInput from '@/components/FileInput';
import PageOverview from '@/components/PageOverview';
import { FileCheck, Upload, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';

const BANNER = {
    verified: { cls: 'border-signal-200 bg-signal-50 dark:bg-signal-500/10 dark:border-signal-500/30 text-signal-800 dark:text-signal-200', icon: ShieldCheck, text: 'Your account is verified.' },
    pending: { cls: 'border-warm/30 bg-warm/10 text-amber-700 dark:text-amber-300', icon: Clock, text: 'Verification in review. We’ll notify you once approved.' },
    rejected: { cls: 'border-danger/30 bg-danger/10 text-danger', icon: XCircle, text: 'Some documents were rejected. Please re-upload.' },
    unverified: { cls: 'border-neutral-200 bg-neutral-50 dark:bg-ink-900 dark:border-ink-800 text-neutral-600 dark:text-neutral-300', icon: FileCheck, text: 'Upload the documents below to verify your business.' },
};
const DOC = { approved: 'text-signal-600 dark:text-signal-400', rejected: 'text-danger', pending: 'text-amber-600 dark:text-amber-300' };

function UploadRow({ doc }) {
    const form = useForm({ type: doc.type, file: null });
    const submit = (e) => { e.preventDefault(); form.post(route('client.kyc.upload'), { preserveScroll: true, forceFormData: true, onSuccess: () => form.reset() }); };
    const Icon = doc.status === 'approved' ? CheckCircle2 : doc.status === 'rejected' ? XCircle : doc.status === 'pending' ? Clock : Upload;
    return (
        <form onSubmit={submit} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${doc.status ? DOC[doc.status] : 'text-neutral-400'}`} /><div><p className="font-medium text-neutral-900 dark:text-white">{doc.label}</p>{doc.uploaded ? <p className="text-xs text-neutral-400">{doc.original_name} · <span className={`capitalize ${DOC[doc.status]}`}>{doc.status}</span>{doc.note ? ` · ${doc.note}` : ''}</p> : <p className="text-xs text-neutral-400">PDF, JPG or PNG · max 10MB</p>}</div></div>
                <div className="w-full sm:w-80 space-y-2">
                    <FileInput value={form.data.file} onChange={(f) => form.setData('file', f)} accept=".pdf,.jpg,.jpeg,.png" hint="PDF, JPG or PNG · max 10MB" />
                    {form.data.file && <button type="submit" disabled={form.processing} className="w-full rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{doc.uploaded ? 'Replace document' : 'Upload document'}</button>}
                </div>
            </div>
            {form.errors.file && <p className="mt-2 text-xs text-danger">{form.errors.file}</p>}
        </form>
    );
}

export default function KycIndex({ kycStatus = 'unverified', types = [] }) {
    const b = BANNER[kycStatus] || BANNER.unverified;
    const Icon = b.icon;
    return (
        <ClientLayout title="Verification">
            <Head title="Verification" />
            <div className="mx-auto max-w-2xl space-y-5">
                <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Business verification</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Verify your business to unlock outbound calling at scale.</p></div>
                <PageOverview feature="kyc" />
                <div className={`flex items-center gap-2 rounded-soft-lg border px-4 py-3 text-sm ${b.cls}`}><Icon className="h-5 w-5 shrink-0" /> {b.text}</div>
                <div className="space-y-3">{types.map((d) => <UploadRow key={d.type} doc={d} />)}</div>
            </div>
        </ClientLayout>
    );
}
