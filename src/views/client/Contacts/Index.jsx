'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import FileInput from '@/components/FileInput';
import PageOverview from '@/components/PageOverview';
import { Pagination } from '@/components/ui';
import { Contact as ContactIcon, Search, Plus, Upload, Trash2, X } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function AddModal({ onClose }) {
    const form = useForm({ name: '', phone: '', email: '', company: '' });
    const submit = (e) => { e.preventDefault(); form.post(route('client.contacts.store'), { preserveScroll: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Add contact</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <input className={inputCls} placeholder="Phone (e.g. +14155550123)" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                {form.errors.phone && <p className="text-xs text-danger">{form.errors.phone}</p>}
                <input className={inputCls} placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                <input className={inputCls} placeholder="Company" value={form.data.company} onChange={(e) => form.setData('company', e.target.value)} />
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button>
                    <button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Add</button>
                </div>
            </form>
        </div>
    );
}

function ImportModal({ onClose }) {
    const form = useForm({ file: null });
    const submit = (e) => { e.preventDefault(); form.post(route('client.contacts.import'), { preserveScroll: true, forceFormData: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Import contacts (CSV)</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <p className="text-xs text-neutral-500">CSV with a <code>phone</code> column (and optional <code>name</code>, <code>email</code>, <code>company</code>). Duplicates are merged by phone number.</p>
                <FileInput value={form.data.file} onChange={(f) => form.setData('file', f)} accept=".csv,.txt" hint="CSV file" />
                {form.errors.file && <p className="text-xs text-danger">{form.errors.file}</p>}
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button>
                    <button type="submit" disabled={form.processing || !form.data.file} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Import</button>
                </div>
            </form>
        </div>
    );
}

export default function ContactsIndex({ contacts, filters = {}, stats = {} }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [modal, setModal] = useState(null);

    const apply = (e) => { e?.preventDefault(); router.get(route('client.contacts.index'), { search }, { preserveState: true, replace: true }); };
    const remove = (c) => { if (confirm('Delete this contact?')) router.delete(route('client.contacts.destroy', c.id), { preserveScroll: true }); };

    return (
        <ClientLayout title={t('nav.contacts') !== 'nav.contacts' ? t('nav.contacts') : 'Contacts'}>
            <Head title="Contacts" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Contacts</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{stats.total ?? 0}{stats.limit ? ` / ${stats.limit}` : ''} contacts · deduped by phone</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setModal('import')} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Upload className="h-4 w-4" /> Import CSV</button>
                        <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Add contact</button>
                    </div>
                </div>

                <PageOverview feature="contacts" />

                <form onSubmit={apply} className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm" />
                </form>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    {contacts.data.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Name', 'Phone', 'Email', 'Company', 'Campaigns', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {contacts.data.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{c.name || '—'}</td>
                                        <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{c.phone_masked}</td>
                                        <td className="px-4 py-3 text-neutral-500">{c.email || '—'}</td>
                                        <td className="px-4 py-3 text-neutral-500">{c.company || '—'}</td>
                                        <td className="px-4 py-3">{c.campaigns_count > 0 ? <span className="rounded-full bg-brand-100 dark:bg-brand-500/20 px-2 py-0.5 text-xs text-brand-700 dark:text-brand-300">{c.campaigns_count}</span> : <span className="text-neutral-400">—</span>}</td>
                                        <td className="px-4 py-3 text-right"><button onClick={() => remove(c)} className="text-danger hover:bg-danger/10 rounded-soft p-1.5"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><ContactIcon className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No contacts yet. Import a CSV or add one manually.</p></div>
                    )}
                </div>

                <Pagination data={contacts} />
            </div>

            {modal === 'add' && <AddModal onClose={() => setModal(null)} />}
            {modal === 'import' && <ImportModal onClose={() => setModal(null)} />}
        </ClientLayout>
    );
}
