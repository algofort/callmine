'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import FileInput from '@/components/FileInput';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { BookOpen, Link2, FileText, Type, Trash2, Plus } from 'lucide-react';

const TYPE_ICON = { url: Link2, file: FileText, text: Type };
const STATUS = {
    ready: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    pending: 'bg-warm/20 text-amber-700 dark:text-amber-300',
    failed: 'bg-danger/10 text-danger',
};

export default function KnowledgeBaseIndex({ items, storage = {}, stats = [] }) {
    const { t } = useTranslation();
    const [type, setType] = useState('text');
    const form = useForm({ type: 'text', title: '', source_url: '', content: '', file: null });

    const setType2 = (tp) => { setType(tp); form.setData('type', tp); };
    const submit = (e) => {
        e.preventDefault();
        form.post(route('client.knowledge-base.store'), { preserveScroll: true, forceFormData: true, onSuccess: () => form.reset() });
    };
    const remove = (i) => { if (confirm(`Remove "${i.title}"?`)) router.delete(route('client.knowledge-base.destroy', i.id), { preserveScroll: true }); };

    const pct = storage.limit_mb ? Math.min(100, Math.round((storage.used_mb / storage.limit_mb) * 100)) : 0;
    const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

    return (
        <ClientLayout title={t('nav.knowledge_base') !== 'nav.knowledge_base' ? t('nav.knowledge_base') : 'Knowledge Base'}>
            <Head title="Knowledge Base" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-3"><PageOverview feature="knowledge-base" /></div>
                <div className="lg:col-span-3"><StatCards items={stats} /></div>
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Knowledge Base</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Give your agents context to ground their answers during calls.</p>
                    </div>

                    {items.data.length === 0 ? (
                        <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-12 text-center">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
                            <p className="text-neutral-500">No knowledge yet. Add a URL, file or text →</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                                <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                    {items.data.map((i) => {
                                        const Icon = TYPE_ICON[i.type] || FileText;
                                        return (
                                            <tr key={i.id}>
                                                <td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-neutral-400" /><span className="font-medium text-neutral-900 dark:text-white">{i.title}</span></div>{i.source_url && <p className="ml-6 truncate text-xs text-neutral-400">{i.source_url}</p>}</td>
                                                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS[i.status] || STATUS.pending}`}>{i.status}</span></td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-neutral-500">{i.size_kb} KB</td>
                                                <td className="px-4 py-3 text-right"><button onClick={() => remove(i)} className="text-danger hover:bg-danger/10 rounded-soft p-1.5"><Trash2 className="h-4 w-4" /></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                        <p className="text-xs font-medium uppercase text-neutral-500">Storage</p>
                        <p className="mt-1 font-mono text-sm text-neutral-700 dark:text-neutral-300">{storage.used_mb ?? 0} / {storage.limit_mb ?? 0} MB</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-ink-800"><div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} /></div>
                    </div>

                    <form onSubmit={submit} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft space-y-3">
                        <p className="font-display font-semibold text-neutral-900 dark:text-white">Add knowledge</p>
                        <div className="flex gap-1.5">
                            {['text', 'url', 'file'].map((tp) => {
                                const Icon = TYPE_ICON[tp];
                                return <button type="button" key={tp} onClick={() => setType2(tp)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-soft border px-2 py-1.5 text-xs capitalize ${type === tp ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}><Icon className="h-3.5 w-3.5" />{tp}</button>;
                            })}
                        </div>
                        <input className={inputCls} placeholder="Title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                        {form.errors.title && <p className="text-xs text-danger">{form.errors.title}</p>}
                        {type === 'url' && <input className={inputCls} placeholder="https://…" value={form.data.source_url} onChange={(e) => form.setData('source_url', e.target.value)} />}
                        {type === 'text' && <textarea rows="5" className={inputCls} placeholder="Paste text content…" value={form.data.content} onChange={(e) => form.setData('content', e.target.value)} />}
                        {type === 'file' && <FileInput value={form.data.file} onChange={(f) => form.setData('file', f)} accept=".pdf,.doc,.docx,.txt" hint="PDF, DOC or TXT" />}
                        {(form.errors.source_url || form.errors.content || form.errors.file) && <p className="text-xs text-danger">{form.errors.source_url || form.errors.content || form.errors.file}</p>}
                        <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Plus className="h-4 w-4" /> Add to knowledge base</button>
                    </form>
                </div>
            </div>
        </ClientLayout>
    );
}
