'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, List, Pencil, Trash2 } from 'lucide-react';

const STATUS = {
    active: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    inactive: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300',
};

export default function FormsIndex({ forms, filters = {}, stats = [] }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');

    const apply = (e) => { e?.preventDefault(); router.get(route('client.forms.index'), { search, status: filters.status || '' }, { preserveState: true, replace: true }); };
    const filter = (status) => router.get(route('client.forms.index'), { search, ...(status ? { status } : {}) }, { preserveState: true, replace: true });
    const remove = (f) => { if (confirm('Delete this form?')) router.delete(route('client.forms.destroy', f.id), { preserveScroll: true }); };

    return (
        <ClientLayout title={t('nav.forms') !== 'nav.forms' ? t('nav.forms') : 'Forms'}>
            <Head title="Forms" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Forms</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Build forms and collect submissions.</p>
                    </div>
                    <Link href={route('client.forms.create')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New form</Link>
                </div>

                <PageOverview feature="forms" />
                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={apply} className="relative max-w-xs flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search forms…" className="w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm" />
                    </form>
                    <div className="flex gap-1.5">
                        {['', 'active', 'inactive'].map((s) => (
                            <button key={s || 'all'} onClick={() => filter(s)} className={`rounded-soft px-3 py-1.5 text-xs font-medium capitalize ${(filters.status || '') === s ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{s || 'All'}</button>
                        ))}
                    </div>
                </div>

                {forms.data.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.data.map((f) => (
                            <div key={f.id} className="flex flex-col rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><FileText className="h-4 w-4" /></span>
                                        <div className="min-w-0"><p className="truncate font-display font-semibold text-neutral-900 dark:text-white">{f.name}</p><p className="text-xs text-neutral-500">{f.fields_count} fields</p></div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[f.status] || STATUS.inactive}`}>{f.status}</span>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                                    <span className="inline-flex items-center gap-1"><List className="h-3.5 w-3.5" /> {f.submissions_count} submissions</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 dark:border-ink-800 pt-3 text-sm">
                                    <Link href={route('client.forms.edit', f.id)} className="inline-flex items-center gap-1 rounded-soft px-2 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                                    <Link href={route('client.forms.submissions', f.id)} className="inline-flex items-center gap-1 rounded-soft px-2 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800"><List className="h-3.5 w-3.5" /> Submissions</Link>
                                    <button onClick={() => remove(f)} className="ml-auto text-danger hover:bg-danger/10 rounded-soft p-1.5"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center"><FileText className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No forms yet.</p><Link href={route('client.forms.create')} className="mt-3 inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Create your first form</Link></div>
                )}

                <Pagination data={forms} />
            </div>
        </ClientLayout>
    );
}
