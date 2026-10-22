'use client';

import { route } from '@/lib/route';
import { Head, Link } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { FileCheck, ArrowRight } from 'lucide-react';

const KYC = { verified: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', pending: 'bg-warm/20 text-amber-700 dark:text-amber-300', rejected: 'bg-danger/10 text-danger', unverified: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800' };

export default function KycIndex({ clients = [] }) {
    return (
        <AdminLayout title="Verification (KYC)">
            <Head title="Verification (KYC)" />
            <div className="space-y-5">
                <div className="flex items-center gap-2"><FileCheck className="h-6 w-6 text-brand-600 dark:text-brand-400" /><h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">Customer verification</h2></div>
                <PageOverview feature="admin-kyc" />
                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50"><tr>{['Customer', 'Status', 'Documents', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {clients.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-3"><p className="font-medium text-neutral-900 dark:text-white">{c.name}</p><p className="text-xs text-neutral-400">{c.email}</p></td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${KYC[c.kyc_status]}`}>{c.kyc_status}</span></td>
                                    <td className="px-4 py-3 text-neutral-500">{c.documents}/4 uploaded</td>
                                    <td className="px-4 py-3 text-right"><Link href={route('admin.kyc.show', c.id)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800">Review <ArrowRight className="h-3.5 w-3.5" /></Link></td>
                                </tr>
                            ))}
                            {clients.length === 0 && <tr><td colSpan="4" className="px-4 py-12 text-center text-neutral-500">No customers.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
