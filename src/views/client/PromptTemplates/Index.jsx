'use client';

import { route } from '@/lib/route';
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import AgentTabs from '@/components/AgentTabs';
import { Pagination } from '@/components/ui';
import { FileText, Plus, Search, Pencil, Trash2, Copy, ShieldCheck, X, Braces } from 'lucide-react';

const CAT = {
    agent_preset: { label: 'Agent preset', cls: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' },
    sales: { label: 'Sales', cls: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300' },
    support: { label: 'Support', cls: 'bg-cold/15 text-cold' },
    appointment: { label: 'Appointment', cls: 'bg-warm/20 text-amber-700 dark:text-amber-300' },
    survey: { label: 'Survey', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
    general: { label: 'General', cls: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300' },
};
const catLabel = (c) => CAT[c]?.label || c;

function TemplateModal({ template, categories, onClose }) {
    const editing = !!template;
    const form = useForm({
        name: template?.name || '',
        category: template?.category || 'general',
        description: template?.description || '',
        content: template?.content || '',
    });
    const vars = useMemo(() => {
        const m = form.data.content.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
        return [...new Set(m.map((x) => x.replace(/[{}\s]/g, '')))];
    }, [form.data.content]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (editing) form.put(route('client.prompt-templates.update', template.id), opts);
        else form.post(route('client.prompt-templates.store'), opts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-2xl rounded-soft-lg bg-white p-5 shadow-soft-xl dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">{editing ? 'Edit template' : 'New template'}</h3>
                    <button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <input className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 sm:col-span-2" placeholder="Template name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    <select className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}>
                        {categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                    </select>
                    <input className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950" placeholder="Short description" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                    <textarea rows="7" className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 font-mono text-sm dark:border-ink-700 dark:bg-ink-950 sm:col-span-2" placeholder="Write your prompt. Use {{variable}} for placeholders…" value={form.data.content} onChange={(e) => form.setData('content', e.target.value)} />
                </div>
                {form.errors.content && <p className="mt-1 text-xs text-danger">{form.errors.content}</p>}
                {vars.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Braces className="h-3.5 w-3.5 text-neutral-400" />
                        {vars.map((v) => <span key={v} className="rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[11px] text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{`{{${v}}}`}</span>)}
                    </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-ink-800">Cancel</button>
                    <button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{editing ? 'Save changes' : 'Create template'}</button>
                </div>
            </form>
        </div>
    );
}

export default function PromptTemplatesIndex({ templates, filters = {}, categories = [], stats = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [modal, setModal] = useState(null); // 'new' | template object

    const applySearch = (e) => { e?.preventDefault(); router.get(route('client.prompt-templates.index'), { search, category: filters.category }, { preserveState: true, replace: true }); };
    const setCategory = (category) => router.get(route('client.prompt-templates.index'), { search, category }, { preserveState: true, replace: true });
    const duplicate = (t) => router.post(route('client.prompt-templates.duplicate', t.id), {}, { preserveScroll: true });
    const remove = (t) => { if (confirm(`Delete "${t.name}"?`)) router.delete(route('client.prompt-templates.destroy', t.id), { preserveScroll: true }); };

    return (
        <ClientLayout title="Prompt Templates">
            <Head title="Prompt Templates" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Agent Workspace</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Reusable AI prompt templates with variables.</p>
                    </div>
                    <button onClick={() => setModal('new')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New template</button>
                </div>

                <AgentTabs active="templates" />
                <PageOverview feature="prompt-templates" />
                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={applySearch} className="relative max-w-xs flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="w-full rounded-soft border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-ink-700 dark:bg-ink-900" />
                    </form>
                    <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setCategory('')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${!filters.category ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-ink-800 dark:text-neutral-300'}`}>All</button>
                        {categories.map((c) => (
                            <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filters.category === c ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-ink-800 dark:text-neutral-300'}`}>{catLabel(c)}</button>
                        ))}
                    </div>
                </div>

                {templates.data.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.data.map((t) => (
                            <div key={t.id} className="flex flex-col rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-soft transition hover:shadow-soft-lg dark:border-ink-800 dark:bg-ink-900">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-medium text-neutral-900 dark:text-white">{t.name}</h3>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {t.is_system && <span className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-ink-800 dark:text-neutral-400"><ShieldCheck className="h-3 w-3" /> System</span>}
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT[t.category]?.cls || CAT.general.cls}`}>{catLabel(t.category)}</span>
                                    </div>
                                </div>
                                {t.description && <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{t.description}</p>}
                                <pre className="mt-3 max-h-24 overflow-hidden whitespace-pre-wrap rounded-soft bg-neutral-50 p-2.5 font-mono text-[11px] leading-relaxed text-neutral-600 dark:bg-ink-950 dark:text-neutral-400">{t.content}</pre>
                                {t.variables?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {t.variables.slice(0, 4).map((v) => <span key={v} className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{`{{${v}}}`}</span>)}
                                        {t.variables.length > 4 && <span className="text-[10px] text-neutral-400">+{t.variables.length - 4} more</span>}
                                    </div>
                                )}
                                <div className="mt-4 flex items-center gap-1 border-t border-neutral-100 pt-3 dark:border-ink-800">
                                    <span className="text-xs text-neutral-400">{t.usage_count}× used</span>
                                    <div className="ml-auto flex items-center gap-0.5">
                                        <button onClick={() => duplicate(t)} title="Duplicate" className="rounded-soft p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-ink-800"><Copy className="h-4 w-4" /></button>
                                        {t.owned && <button onClick={() => setModal(t)} title="Edit" className="rounded-soft p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>}
                                        {t.owned && <button onClick={() => remove(t)} title="Delete" className="rounded-soft p-1.5 text-neutral-400 hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-ink-700">
                        <FileText className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
                        <p className="text-neutral-500">No templates match. Create one to get started.</p>
                    </div>
                )}

                <Pagination data={templates} />
            </div>

            {modal === 'new' && <TemplateModal categories={categories} onClose={() => setModal(null)} />}
            {modal && modal !== 'new' && <TemplateModal template={modal} categories={categories} onClose={() => setModal(null)} />}
        </ClientLayout>
    );
}
