'use client';

import { route } from '@/lib/route';
import { Head, Link, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Code } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function slugify(str) {
    return (str || '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
}

export default function FormsBuilder({ form, isNew = true, fieldTypes = [] }) {
    const { t } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm({
        name: form.name || '',
        description: form.description || '',
        status: form.status || 'active',
        fields: form.fields || [],
    });

    const setFields = (fields) => setData('fields', fields);
    const addField = () => setFields([...data.fields, { key: `field_${data.fields.length + 1}`, label: '', type: fieldTypes[0] || 'text', required: false, options: [] }]);
    const removeField = (i) => setFields(data.fields.filter((_, idx) => idx !== i));
    const updateField = (i, patch) => setFields(data.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= data.fields.length) return;
        const next = [...data.fields];
        [next[i], next[j]] = [next[j], next[i]];
        setFields(next);
    };

    const submit = (e) => {
        e.preventDefault();
        if (isNew) post(route('client.forms.store'));
        else put(route('client.forms.update', form.id), { preserveScroll: true });
    };

    const embedSnippet = form.public_token
        ? `<iframe src="${window.location.origin}/f/${form.public_token}" width="100%" height="600" frameborder="0"></iframe>`
        : null;

    return (
        <ClientLayout title={t('nav.forms') !== 'nav.forms' ? t('nav.forms') : 'Forms'}>
            <Head title={isNew ? 'New form' : 'Edit form'} />
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('client.forms.index')} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><ArrowLeft className="h-4 w-4" /> Forms</Link>
                </div>
                <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{isNew ? 'New form' : 'Edit form'}</h1>

                <form onSubmit={submit} className="space-y-5">
                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft space-y-4">
                        <div>
                            <label className="block text-xs font-medium uppercase text-neutral-500 mb-1">Name</label>
                            <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contact form" />
                            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-neutral-500 mb-1">Description</label>
                            <textarea className={inputCls} rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Optional description" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-neutral-500 mb-1">Status</label>
                            <select className={inputCls} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-semibold text-neutral-900 dark:text-white">Fields</h2>
                            <button type="button" onClick={addField} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Plus className="h-4 w-4" /> Add field</button>
                        </div>
                        {errors.fields && <p className="text-xs text-danger">{errors.fields}</p>}

                        {data.fields.length === 0 ? (
                            <p className="py-6 text-center text-sm text-neutral-400">No fields yet. Add one to get started.</p>
                        ) : (
                            <div className="space-y-3">
                                {data.fields.map((field, i) => (
                                    <div key={i} className="rounded-soft border border-neutral-200 dark:border-ink-800 p-3 space-y-2">
                                        <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
                                            <input className={inputCls} value={field.label} placeholder="Label" onChange={(e) => updateField(i, { label: e.target.value, key: field._touchedKey ? field.key : slugify(e.target.value) })} />
                                            <select className={inputCls} value={field.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                                                {fieldTypes.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                            <input className={inputCls + ' font-mono text-xs'} value={field.key} placeholder="key" onChange={(e) => updateField(i, { key: slugify(e.target.value), _touchedKey: true })} />
                                            <div className="flex items-center gap-1">
                                                <label className="inline-flex items-center gap-1 px-2 text-xs text-neutral-600 dark:text-neutral-300">
                                                    <input type="checkbox" checked={!!field.required} onChange={(e) => updateField(i, { required: e.target.checked })} /> Required
                                                </label>
                                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => move(i, 1)} disabled={i === data.fields.length - 1} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => removeField(i)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        {field.type === 'select' && (
                                            <input className={inputCls} value={(field.options || []).join(', ')} placeholder="Options, comma separated" onChange={(e) => updateField(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {embedSnippet && (
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft space-y-2">
                            <h2 className="flex items-center gap-2 font-display font-semibold text-neutral-900 dark:text-white"><Code className="h-4 w-4" /> Embed snippet</h2>
                            <p className="text-xs text-neutral-500">Paste this into any page to embed the form.</p>
                            <pre className="overflow-x-auto rounded-soft bg-neutral-100 dark:bg-ink-800 p-3 text-xs font-mono text-neutral-700 dark:text-neutral-300"><code>{embedSnippet}</code></pre>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Save className="h-4 w-4" /> {isNew ? 'Create form' : 'Save changes'}</button>
                    </div>
                </form>
            </div>
        </ClientLayout>
    );
}
