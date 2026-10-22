'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Network, Plus, Trash2, X } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

const ACTION_LABELS = {
    connect_agent: 'Connect agent',
    voicemail: 'Voicemail',
    forward: 'Forward',
};
const ACTION_ACCENTS = {
    connect_agent: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300',
    voicemail: 'bg-neutral-100 dark:bg-ink-800 text-neutral-600 dark:text-neutral-300',
    forward: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
};

function AddModal({ numbers, agents, onClose }) {
    const form = useForm({
        name: '',
        phone_number_id: '',
        agent_id: '',
        action: 'connect_agent',
        forward_to: '',
        priority: 0,
        enabled: true,
    });

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            phone_number_id: data.phone_number_id || null,
            agent_id: data.agent_id || null,
        })).post(route('client.incoming-connections.store'), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">New route</h3>
                    <button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button>
                </div>

                <div>
                    <input className={inputCls} placeholder="Route name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    {form.errors.name && <p className="mt-1 text-xs text-danger">{form.errors.name}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">Inbound number</label>
                    <select className={inputCls} value={form.data.phone_number_id} onChange={(e) => form.setData('phone_number_id', e.target.value)}>
                        <option value="">Any number</option>
                        {numbers.map((n) => <option key={n.id} value={n.id}>{n.e164_number}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">Action</label>
                    <select className={inputCls} value={form.data.action} onChange={(e) => form.setData('action', e.target.value)}>
                        <option value="connect_agent">Connect agent</option>
                        <option value="voicemail">Voicemail</option>
                        <option value="forward">Forward</option>
                    </select>
                </div>

                {form.data.action === 'connect_agent' && (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-500">Agent</label>
                        <select className={inputCls} value={form.data.agent_id} onChange={(e) => form.setData('agent_id', e.target.value)}>
                            <option value="">Select agent</option>
                            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                )}

                {form.data.action === 'forward' && (
                    <div>
                        <input className={inputCls} placeholder="Forward to (e.g. +14155550123)" value={form.data.forward_to} onChange={(e) => form.setData('forward_to', e.target.value)} />
                        {form.errors.forward_to && <p className="mt-1 text-xs text-danger">{form.errors.forward_to}</p>}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-neutral-500">Priority</label>
                        <input type="number" min="0" className={inputCls} value={form.data.priority} onChange={(e) => form.setData('priority', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 pt-5 text-sm text-neutral-700 dark:text-neutral-300">
                        <input type="checkbox" checked={form.data.enabled} onChange={(e) => form.setData('enabled', e.target.checked)} />
                        Enabled
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button>
                    <button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Create</button>
                </div>
            </form>
        </div>
    );
}

export default function IncomingConnectionsIndex({ routes = [], stats = [], numbers = [], agents = [] }) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const toggle = (r) => router.put(route('client.incoming-connections.update', r.id), {
        name: r.name,
        phone_number_id: r.phone_number_id,
        agent_id: r.agent_id,
        action: r.action,
        forward_to: r.forward_to,
        priority: r.priority,
        enabled: !r.enabled,
    }, { preserveScroll: true });

    const remove = (r) => { if (confirm('Delete this route?')) router.delete(route('client.incoming-connections.destroy', r.id), { preserveScroll: true }); };

    const target = (r) => {
        if (r.action === 'connect_agent') return r.agent_name || '—';
        if (r.action === 'forward') return r.forward_to || '—';
        return '—';
    };

    const title = t('nav.incoming-connections') !== 'nav.incoming-connections' ? t('nav.incoming-connections') : 'Incoming Connections';

    return (
        <ClientLayout title={title}>
            <Head title="Incoming Connections" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Incoming Connections</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Route inbound callers to AI agents, voicemail, or forwarding.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New route</button>
                </div>

                <PageOverview feature="incoming-connections" />

                <StatCards items={stats} />

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    {routes.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Name', 'Inbound number', 'Action', 'Target', 'Priority', 'Enabled', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {routes.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{r.name}</td>
                                        <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{r.e164_number || 'Any'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${ACTION_ACCENTS[r.action] || ACTION_ACCENTS.voicemail}`}>{ACTION_LABELS[r.action] || r.action}</span>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-500">{target(r)}</td>
                                        <td className="px-4 py-3 text-neutral-500">{r.priority}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggle(r)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${r.enabled ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-ink-700'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${r.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right"><button onClick={() => remove(r)} className="text-danger hover:bg-danger/10 rounded-soft p-1.5"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><Network className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No routing rules yet. Create one to connect inbound callers to an AI agent.</p></div>
                    )}
                </div>
            </div>

            {showModal && <AddModal numbers={numbers} agents={agents} onClose={() => setShowModal(false)} />}
        </ClientLayout>
    );
}
