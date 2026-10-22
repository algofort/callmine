'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, Link, router, useForm } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import SetupGuide from '@/components/SetupGuide';
import {
    Phone, AudioLines, CheckCircle2, XCircle, ArrowLeft, Save, Plug, Plus, Trash2,
    Activity, RefreshCw, Server,
} from 'lucide-react';

const FIELD_LABEL = {
    account_sid: 'Account SID', auth_token: 'Auth token', default_from: 'Default caller ID (E.164)',
    auth_id: 'Auth ID', api_key: 'API key',
};

const FIELD_HINT = {
    default_from: 'A phone number you already own in this provider, in full E.164 format (e.g. +14155550123). Used as the "From" number when placing calls if a campaign has no number of its own. Optional — leave blank if every campaign brings its own number.',
    account_sid: 'From your Twilio Console dashboard — starts with "AC".',
    auth_token: 'From your Twilio Console dashboard, next to the Account SID.',
};

function StatusPill({ ok }) {
    return ok
        ? <span className="inline-flex items-center gap-1 rounded-full bg-signal-100 px-2.5 py-1 text-xs font-medium text-signal-700 dark:bg-signal-500/20 dark:text-signal-300"><CheckCircle2 className="h-3.5 w-3.5" /> Configured</span>
        : <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-ink-800 dark:text-neutral-400"><XCircle className="h-3.5 w-3.5" /> Not configured</span>;
}

// ── Credential form (Twilio / Plivo / OpenAI) ────────────────────
function CredentialForm({ provider }) {
    const initial = { enabled: provider.enabled };
    provider.fields.forEach((f) => { initial[f.name] = ''; });
    const form = useForm(initial);
    const save = (e) => { e.preventDefault(); form.put(route('admin.engines.provider.update', provider.key), { preserveScroll: true }); };
    const test = () => router.post(route('admin.engines.provider.test', provider.key), {}, { preserveScroll: true });

    return (
        <form onSubmit={save} className="max-w-xl space-y-4 rounded-soft-lg border border-neutral-200 bg-white p-6 shadow-soft dark:border-ink-800 dark:bg-ink-900">
            {provider.fields.map((f) => (
                <label key={f.name} className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{FIELD_LABEL[f.name] || f.name}</span>
                    <input
                        type={f.secret ? 'password' : 'text'}
                        value={form.data[f.name]}
                        onChange={(e) => form.setData(f.name, e.target.value)}
                        placeholder={f.set ? '•••••••• (saved — leave blank to keep)' : ''}
                        className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
                    />
                    {FIELD_HINT[f.name] && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{FIELD_HINT[f.name]}</p>}
                    {form.errors[f.name] && <p className="mt-1 text-xs text-danger">{form.errors[f.name]}</p>}
                </label>
            ))}

            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" checked={form.data.enabled} onChange={(e) => form.setData('enabled', e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
                Enabled for engines
            </label>

            <div className="flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-ink-800">
                <button type="submit" disabled={form.processing} className="inline-flex items-center gap-1.5 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Save className="h-4 w-4" /> Save</button>
                <button type="button" onClick={test} className="inline-flex items-center gap-1.5 rounded-soft border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><Plug className="h-4 w-4" /> Test connection</button>
            </div>
        </form>
    );
}

// ── ElevenLabs key pool ──────────────────────────────────────────
function Stat({ label, value, sub }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
            {sub && <p className="text-xs text-neutral-500">{sub}</p>}
        </div>
    );
}

function ElevenLabsPool({ provider, keys, poolStats }) {
    const [adding, setAdding] = useState(false);
    const form = useForm({ label: '', api_key: '', max_concurrency: 30 });
    const enabledForm = useForm({ enabled: provider.enabled });

    const submit = (e) => { e.preventDefault(); form.post(route('admin.elevenlabs-keys.store'), { preserveScroll: true, onSuccess: () => { form.reset(); setAdding(false); } }); };
    const remove = (k) => { if (confirm(`Remove key "${k.label}"?`)) router.delete(route('admin.elevenlabs-keys.destroy', k.id), { preserveScroll: true }); };
    const health = () => router.post(route('admin.elevenlabs-keys.health-check'), {}, { preserveScroll: true });
    const sync = () => router.post(route('admin.elevenlabs-keys.sync-voices'), {}, { preserveScroll: true });
    const toggleEnabled = (v) => enabledForm.transform(() => ({ enabled: v })).put(route('admin.engines.provider.update', 'elevenlabs'), { preserveScroll: true });

    const statusClass = (s) => s === 'active' ? 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300'
        : s === 'unhealthy' ? 'bg-danger/10 text-danger' : 'bg-neutral-100 text-neutral-500 dark:bg-ink-800';

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input type="checkbox" checked={enabledForm.data.enabled} onChange={(e) => { enabledForm.setData('enabled', e.target.checked); toggleEnabled(e.target.checked); }} className="h-4 w-4 rounded accent-brand-600" />
                    Enabled for engines
                </label>
                <div className="flex gap-2">
                    <button onClick={health} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><Activity className="h-4 w-4" /> Health check</button>
                    <button onClick={sync} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><RefreshCw className="h-4 w-4" /> Sync voices</button>
                    <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Add key</button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total capacity" value={poolStats.capacity ?? 0} sub="concurrent calls" />
                <Stat label="Current load" value={poolStats.current_load ?? 0} sub={`${poolStats.utilization ?? 0}% utilization`} />
                <Stat label="Voices" value={poolStats.total_voices ?? 0} sub="in library" />
                <Stat label="Keys" value={poolStats.key_count ?? 0} sub={`${poolStats.total_agents ?? 0} agents`} />
            </div>

            {adding && (
                <form onSubmit={submit} className="grid gap-3 rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Label</label>
                        <input className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950" placeholder="e1" value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} />
                        {form.errors.label && <p className="mt-1 text-xs text-danger">{form.errors.label}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-neutral-500">API key</label>
                        <input className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950" type="password" placeholder="sk_..." value={form.data.api_key} onChange={(e) => form.setData('api_key', e.target.value)} />
                        {form.errors.api_key && <p className="mt-1 text-xs text-danger">{form.errors.api_key}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Max concurrency</label>
                        <div className="flex gap-2">
                            <input className="w-full rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950" type="number" min="1" value={form.data.max_concurrency} onChange={(e) => form.setData('max_concurrency', Number(e.target.value))} />
                            <button type="submit" disabled={form.processing} className="shrink-0 rounded-soft bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Save</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-soft-lg border border-neutral-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                    <thead className="bg-neutral-50 dark:bg-ink-800/50">
                        <tr>{['Key', 'Status', 'Load', 'Last check', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                        {keys.map((k) => (
                            <tr key={k.id}>
                                <td className="px-4 py-3"><div className="flex items-center gap-2"><Server className="h-4 w-4 text-neutral-400" /><span className="font-medium text-neutral-900 dark:text-white">{k.label}</span><span className="font-mono text-xs text-neutral-400">{k.key_hint}</span></div></td>
                                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(k.status)}`}>{k.status}</span></td>
                                <td className="px-4 py-3 font-mono tabular-nums text-neutral-600 dark:text-neutral-300">{k.current_load} / {k.max_concurrency}</td>
                                <td className="px-4 py-3 text-neutral-500">{k.last_health_check_at ? new Date(k.last_health_check_at).toLocaleString() : '—'}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => remove(k)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></td>
                            </tr>
                        ))}
                        {keys.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-neutral-500">No keys yet. Add an ElevenLabs API key to build the pool.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function EngineProvider({ provider, keys = [], poolStats = {} }) {
    const Icon = provider.kind === 'telephony' ? Phone : AudioLines;
    return (
        <AdminLayout title={provider.label}>
            <Head title={`${provider.label} · Engines`} />
            <div className="space-y-5">
                <Link href={route('admin.engines.index')} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><ArrowLeft className="h-4 w-4" /> Engines</Link>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300"><Icon className="h-5 w-5" /></span>
                        <div>
                            <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">{provider.label}</h2>
                            <p className="text-xs capitalize text-neutral-400">{provider.kind} provider</p>
                        </div>
                    </div>
                    <StatusPill ok={provider.configured} />
                </div>

                <SetupGuide guide={provider.key} />

                {provider.key === 'elevenlabs'
                    ? <ElevenLabsPool provider={provider} keys={keys} poolStats={poolStats} />
                    : <CredentialForm provider={provider} />}
            </div>
        </AdminLayout>
    );
}
