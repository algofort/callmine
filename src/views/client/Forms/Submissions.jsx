'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui';
import { ArrowLeft, List } from 'lucide-react';

export default function FormsSubmissions({ form, submissions }) {
    const { t } = useTranslation();
    const fields = form.fields || [];

    return (
        <ClientLayout title={t('nav.forms') !== 'nav.forms' ? t('nav.forms') : 'Forms'}>
            <Head title={`${form.name} · Submissions`} />
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('client.forms.index')} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><ArrowLeft className="h-4 w-4" /> Forms</Link>
                </div>
                <div>
                    <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{form.name}</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Submissions</p>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    {submissions.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                                <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                                        {fields.map((f) => <th key={f.key} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{f.label || f.key}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                    {submissions.data.map((s) => (
                                        <tr key={s.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{new Date(s.created_at).toLocaleString()}</td>
                                            {fields.map((f) => {
                                                const val = s.data?.[f.key];
                                                const display = Array.isArray(val) ? val.join(', ') : (val ?? '');
                                                return <td key={f.key} className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{display !== '' ? String(display) : '—'}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center"><List className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No submissions yet.</p></div>
                    )}
                </div>

                <Pagination data={submissions} />
            </div>
        </ClientLayout>
    );
}
