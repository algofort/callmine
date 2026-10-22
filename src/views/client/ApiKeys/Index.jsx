'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm, usePage } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import SetupGuide from '@/components/SetupGuide';
import StatCards from '@/components/StatCards';
import { Code2, Plus, Trash2, Ban, Copy, X, BookOpen } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function CreateModal({ scopes, onClose }) {
    const form = useForm({ name: '', scopes: ['calls:read', 'calls:write'], ip_whitelist: '' });
    const toggle = (s) => form.setData('scopes', form.data.scopes.includes(s) ? form.data.scopes.filter((x) => x !== s) : [...form.data.scopes, s]);
    const submit = (e) => { e.preventDefault(); form.post(route('client.api-keys.store'), { preserveScroll: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">New API key</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Key name (e.g. Production)" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                {form.errors.name && <p className="text-xs text-danger">{form.errors.name}</p>}
                <div>
                    <p className="mb-1 text-xs font-medium uppercase text-neutral-500">Scopes</p>
                    <div className="grid max-h-44 grid-cols-2 gap-1 overflow-auto">{scopes.map((s) => <label key={s} className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"><input type="checkbox" checked={form.data.scopes.includes(s)} onChange={() => toggle(s)} /> <code className="font-mono">{s}</code></label>)}</div>
                </div>
                <input className={inputCls} placeholder="IP whitelist (comma-separated, optional)" value={form.data.ip_whitelist} onChange={(e) => form.setData('ip_whitelist', e.target.value)} />
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Create</button></div>
            </form>
        </div>
    );
}

export default function ApiKeysIndex({ keys = [], availableScopes = [], limit = 0, auditLog = [], newKey = null, stats = [] }) {
    const [creating, setCreating] = useState(false);
    const { props } = usePage();
    const flashKey = newKey || props.flash?.newKey;
    const copy = (s) => navigator.clipboard?.writeText(s);
    const revoke = (k) => { if (confirm(`Revoke "${k.name}"?`)) router.post(route('client.api-keys.revoke', k.id), {}, { preserveScroll: true }); };
    const remove = (k) => { if (confirm(`Delete "${k.name}"?`)) router.delete(route('client.api-keys.destroy', k.id), { preserveScroll: true }); };
    const activeCount = keys.filter((k) => !k.revoked).length;

    return (
        <ClientLayout title="API Keys">
            <Head title="API Keys" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">API Keys</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{activeCount}/{limit} active · <a href={route('api.docs.playground')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400"><BookOpen className="h-3.5 w-3.5" /> API docs</a></p></div>
                    <button onClick={() => setCreating(true)} disabled={activeCount >= limit} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Plus className="h-4 w-4" /> New key</button>
                </div>

                <PageOverview feature="api-keys" />

                <SetupGuide guide="api-keys" />
                <StatCards items={stats} />

                {flashKey && (
                    <div className="rounded-soft-lg border border-signal-300 bg-signal-50 dark:bg-signal-900/20 dark:border-signal-800 p-4">
                        <p className="text-sm font-medium text-signal-800 dark:text-signal-200">Copy your API key now — it won't be shown again.</p>
                        <div className="mt-2 flex items-center gap-2"><code className="flex-1 truncate rounded bg-white dark:bg-ink-900 px-3 py-2 font-mono text-xs">{flashKey.plain}</code><button onClick={() => copy(flashKey.plain)} className="rounded-soft bg-brand-600 px-3 py-2 text-white hover:bg-brand-500"><Copy className="h-4 w-4" /></button></div>
                    </div>
                )}

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50"><tr>{['Name', 'Prefix', 'Scopes', 'Last used', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {keys.map((k) => (
                                <tr key={k.id} className={k.revoked ? 'opacity-50' : ''}>
                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{k.name}{k.revoked && <span className="ml-2 text-xs text-danger">revoked</span>}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{k.prefix}…</td>
                                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(k.scopes || []).slice(0, 3).map((s) => <span key={s} className="rounded-full bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 text-[10px] text-brand-700 dark:text-brand-300">{s}</span>)}{(k.scopes || []).length > 3 && <span className="text-[10px] text-neutral-400">+{k.scopes.length - 3}</span>}</div></td>
                                    <td className="px-4 py-3 text-neutral-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'never'}</td>
                                    <td className="px-4 py-3 text-right"><div className="inline-flex gap-1">{!k.revoked && <button onClick={() => revoke(k)} title="Revoke" className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Ban className="h-4 w-4" /></button>}<button onClick={() => remove(k)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></div></td>
                                </tr>
                            ))}
                            {keys.length === 0 && <tr><td colSpan="5" className="px-4 py-12 text-center text-neutral-500"><Code2 className="mx-auto mb-2 h-10 w-10 text-neutral-300" />No API keys yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {auditLog.length > 0 && (
                    <div>
                        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Recent API requests</h2>
                        <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm"><tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {auditLog.map((l, i) => <tr key={i}><td className="px-4 py-2 font-mono text-xs">{l.method}</td><td className="px-4 py-2 font-mono text-xs text-neutral-500">/{l.path}</td><td className="px-4 py-2"><span className={`font-mono text-xs ${l.status_code < 300 ? 'text-signal-600' : 'text-danger'}`}>{l.status_code}</span></td><td className="px-4 py-2 text-xs text-neutral-400">{l.duration_ms}ms · {new Date(l.created_at).toLocaleTimeString()}</td></tr>)}
                            </tbody></table>
                        </div>
                    </div>
                )}
            </div>
            {creating && <CreateModal scopes={availableScopes} onClose={() => setCreating(false)} />}
        </ClientLayout>
    );
}
