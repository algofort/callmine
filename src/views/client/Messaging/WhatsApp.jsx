'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { MessageCircle, Plus, Trash2, X, BadgeCheck } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function AccountModal({ providers, onClose }) {
    const form = useForm({ provider: providers[0]?.key || 'meta', label: '', display_number: '', phone_number_id: '', waba_id: '', access_token: '', api_key: '', base_url: '' });
    const isMeta = form.data.provider === 'meta';
    const submit = (e) => { e.preventDefault(); form.post(route('client.messaging.whatsapp.accounts.store'), { preserveScroll: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Connect WhatsApp</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <select className={inputCls} value={form.data.provider} onChange={(e) => form.setData('provider', e.target.value)}>{providers.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select>
                <input className={inputCls} placeholder="Label" value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} />
                <input className={inputCls} placeholder="Display number (+1…)" value={form.data.display_number} onChange={(e) => form.setData('display_number', e.target.value)} />
                <input className={inputCls} placeholder={isMeta ? 'Phone number ID' : 'Account / device ID'} value={form.data.phone_number_id} onChange={(e) => form.setData('phone_number_id', e.target.value)} />
                {isMeta ? (
                    <>
                        <input className={inputCls} placeholder="WABA ID" value={form.data.waba_id} onChange={(e) => form.setData('waba_id', e.target.value)} />
                        <input className={inputCls} placeholder="Access token" value={form.data.access_token} onChange={(e) => form.setData('access_token', e.target.value)} />
                    </>
                ) : (
                    <>
                        <input className={inputCls} placeholder="WhatsWay base URL" value={form.data.base_url} onChange={(e) => form.setData('base_url', e.target.value)} />
                        <input className={inputCls} placeholder="API key" value={form.data.api_key} onChange={(e) => form.setData('api_key', e.target.value)} />
                    </>
                )}
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Connect</button></div>
            </form>
        </div>
    );
}

function TemplateModal({ accounts, onClose }) {
    const form = useForm({ whatsapp_account_id: accounts[0]?.id || '', name: '', language: 'en_US', category: 'UTILITY', body: '' });
    const submit = (e) => { e.preventDefault(); form.post(route('client.messaging.whatsapp.templates.store'), { preserveScroll: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">New WhatsApp template</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Template name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} placeholder="Language (en_US)" value={form.data.language} onChange={(e) => form.setData('language', e.target.value)} />
                    <select className={inputCls} value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}><option>UTILITY</option><option>MARKETING</option><option>AUTHENTICATION</option></select>
                </div>
                <textarea rows="4" className={inputCls} placeholder="Body — use {{1}}, {{2}} for params" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} />
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Save</button></div>
            </form>
        </div>
    );
}

export default function WhatsApp({ accounts = [], templates = [], enabledProviders = [] }) {
    const [modal, setModal] = useState(null);
    const removeAccount = (a) => { if (confirm('Remove account?')) router.delete(route('client.messaging.whatsapp.accounts.destroy', a.id), { preserveScroll: true }); };
    const removeTemplate = (t) => { if (confirm('Delete template?')) router.delete(route('client.messaging.whatsapp.templates.destroy', t.id), { preserveScroll: true }); };

    return (
        <ClientLayout title="WhatsApp">
            <Head title="WhatsApp" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">WhatsApp</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Connect accounts and manage message templates.</p></div>
                    <div className="flex gap-2">
                        <button onClick={() => setModal('template')} disabled={accounts.length === 0} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 disabled:opacity-40"><Plus className="h-4 w-4" /> Template</button>
                        <button onClick={() => setModal('account')} disabled={enabledProviders.length === 0} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-40"><Plus className="h-4 w-4" /> Connect account</button>
                    </div>
                </div>

                {enabledProviders.length === 0 && <div className="rounded-soft-lg border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">WhatsApp is disabled platform-wide. Ask your administrator to enable a provider.</div>}

                <div>
                    <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Accounts</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {accounts.map((a) => (
                            <div key={a.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div><div className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-signal-500" /><p className="font-display font-semibold text-neutral-900 dark:text-white">{a.label || a.display_number || a.provider}</p>{a.verified && <BadgeCheck className="h-4 w-4 text-brand-500" />}</div><p className="mt-1 text-xs capitalize text-neutral-500">{a.provider} · {a.status}{a.quality_rating ? ` · ${a.quality_rating}` : ''}</p></div>
                                    <button onClick={() => removeAccount(a)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && <p className="text-sm text-neutral-500">No accounts connected.</p>}
                    </div>
                </div>

                <div>
                    <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Templates</h2>
                    <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                        {templates.length > 0 ? (
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm"><tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {templates.map((t) => (
                                    <tr key={t.id}><td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">{t.name}</td><td className="px-4 py-2.5 text-neutral-500">{t.language} · {t.category}</td><td className="px-4 py-2.5"><span className="rounded-full bg-signal-100 px-2 py-0.5 text-[11px] text-signal-700 dark:bg-signal-500/20 dark:text-signal-300">{t.status}</span></td><td className="px-4 py-2.5 text-right"><button onClick={() => removeTemplate(t)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></td></tr>
                                ))}
                            </tbody></table>
                        ) : <p className="px-4 py-8 text-center text-sm text-neutral-500">No templates yet.</p>}
                    </div>
                </div>
            </div>

            {modal === 'account' && <AccountModal providers={enabledProviders} onClose={() => setModal(null)} />}
            {modal === 'template' && <TemplateModal accounts={accounts} onClose={() => setModal(null)} />}
        </ClientLayout>
    );
}
