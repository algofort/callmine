'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { Mail, Plus, Pencil, Trash2, Copy, Send, X } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';
const VARS = ['name', 'company', 'appointmentDate', 'time'];

function Editor({ initial, onClose }) {
    const editing = Boolean(initial?.id);
    const form = useForm({ name: initial?.name || '', subject: initial?.subject || '', html: initial?.html || '', is_active: initial?.is_active ?? true });
    const insertVar = (v) => form.setData('html', `${form.data.html}{{${v}}}`);
    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        editing ? form.put(route('client.messaging.email-templates.update', initial.id), opts) : form.post(route('client.messaging.email-templates.store'), opts);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="grid max-h-[88vh] w-full max-w-4xl grid-cols-1 gap-4 overflow-auto rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl lg:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={submit} className="space-y-3">
                    <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">{editing ? 'Edit template' : 'New email template'}</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                    <input className={inputCls} placeholder="Template name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    <input className={inputCls} placeholder="Subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} />
                    <div className="flex flex-wrap gap-1">{VARS.map((v) => <button type="button" key={v} onClick={() => insertVar(v)} className="rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-700 dark:text-brand-300">{`{{${v}}}`}</button>)}</div>
                    <textarea rows="12" className={`${inputCls} font-mono text-xs`} placeholder="<h1>Hello {{name}}</h1> …HTML…" value={form.data.html} onChange={(e) => form.setData('html', e.target.value)} />
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} /> Active</label>
                    <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{editing ? 'Save' : 'Create'}</button></div>
                </form>
                <div className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white p-2">
                    <p className="mb-1 px-1 text-xs font-medium uppercase text-neutral-400">Preview</p>
                    <iframe title="preview" className="h-[420px] w-full rounded bg-white" srcDoc={form.data.html} />
                </div>
            </div>
        </div>
    );
}

export default function EmailTemplates({ templates = [] }) {
    const [modal, setModal] = useState(null);
    const remove = (t) => { if (confirm(`Delete "${t.name}"?`)) router.delete(route('client.messaging.email-templates.destroy', t.id), { preserveScroll: true }); };
    const dup = (t) => router.post(route('client.messaging.email-templates.duplicate', t.id), {}, { preserveScroll: true });
    const test = (t) => { const email = prompt('Send test to email:'); if (email) router.post(route('client.messaging.email-templates.test', t.id), { email }, { preserveScroll: true }); };

    return (
        <ClientLayout title="Email Templates">
            <Head title="Email Templates" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Email Templates</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Design emails your AI agents send during or after calls.</p></div>
                    <button onClick={() => setModal({})} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New template</button>
                </div>
                {templates.length === 0 ? (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center"><Mail className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No email templates yet.</p></div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.map((t) => (
                            <div key={t.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" /><p className="font-display font-semibold text-neutral-900 dark:text-white">{t.name}</p>{!t.is_active && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 dark:bg-ink-800">Off</span>}</div>
                                <p className="mt-1 truncate text-xs text-neutral-500">{t.subject || '—'}</p>
                                <div className="mt-3 flex gap-1 border-t border-neutral-100 dark:border-ink-800 pt-3">
                                    <button onClick={() => setModal(t)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => dup(t)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Copy className="h-4 w-4" /></button>
                                    <button onClick={() => test(t)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Send className="h-4 w-4" /></button>
                                    <button onClick={() => remove(t)} className="ml-auto rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {modal && <Editor initial={modal} onClose={() => setModal(null)} />}
        </ClientLayout>
    );
}
