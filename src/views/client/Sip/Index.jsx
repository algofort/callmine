'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import SetupGuide from '@/components/SetupGuide';
import StatCards from '@/components/StatCards';
import { Network, Plus, Trash2, X, PhoneIncoming, Server } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function TrunkModal({ templates, engines, onClose }) {
    const form = useForm({ name: '', provider: 'generic', engine: engines[0]?.key || 'elevenlabs', sip_host: '', sip_port: 5060, transport: 'udp', username: '', password: '', auth_id: '', inbound_enabled: true, outbound_enabled: true, concurrency_limit: 5 });
    const pickProvider = (p) => { const t = templates[p] || {}; form.setData((d) => ({ ...d, provider: p, sip_host: t.sip_host ?? d.sip_host, sip_port: t.sip_port ?? d.sip_port, transport: t.transport ?? d.transport })); };
    const submit = (e) => { e.preventDefault(); form.post(route('client.sip.trunks.store'), { preserveScroll: true, onSuccess: onClose }); };
    const engine = engines.find((x) => x.key === form.data.engine);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="max-h-[88vh] w-full max-w-lg space-y-3 overflow-auto rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Add SIP trunk</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Trunk name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <select className={inputCls} value={form.data.provider} onChange={(e) => pickProvider(e.target.value)}>{Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}</select>
                    <select className={inputCls} value={form.data.engine} onChange={(e) => form.setData('engine', e.target.value)}>{engines.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}</select>
                </div>
                {engine && !engine.outbound && <p className="text-xs text-warm">{engine.name} supports inbound numbers only.</p>}
                <div className="grid grid-cols-3 gap-2">
                    <input className={`${inputCls} col-span-2`} placeholder="SIP host" value={form.data.sip_host} onChange={(e) => form.setData('sip_host', e.target.value)} />
                    <input className={inputCls} type="number" placeholder="Port" value={form.data.sip_port} onChange={(e) => form.setData('sip_port', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <select className={inputCls} value={form.data.transport} onChange={(e) => form.setData('transport', e.target.value)}><option value="udp">UDP</option><option value="tcp">TCP</option><option value="tls">TLS</option></select>
                    <input className={`${inputCls} col-span-2`} type="number" placeholder="Concurrency" value={form.data.concurrency_limit} onChange={(e) => form.setData('concurrency_limit', Number(e.target.value))} />
                </div>
                <input className={inputCls} placeholder="Username" value={form.data.username} onChange={(e) => form.setData('username', e.target.value)} />
                <input className={inputCls} type="password" placeholder="Password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                <div className="flex gap-4 text-sm text-neutral-700 dark:text-neutral-300">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.data.inbound_enabled} onChange={(e) => form.setData('inbound_enabled', e.target.checked)} /> Inbound</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.data.outbound_enabled} onChange={(e) => form.setData('outbound_enabled', e.target.checked)} /> Outbound</label>
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Add trunk</button></div>
            </form>
        </div>
    );
}

function NumberModal({ trunks, agents, onClose }) {
    const form = useForm({ sip_trunk_id: trunks[0]?.id || '', phone: '', direction: 'inbound', agent_id: '' });
    const submit = (e) => { e.preventDefault(); form.post(route('client.sip.numbers.import'), { preserveScroll: true, onSuccess: onClose }); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Import number</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <select className={inputCls} value={form.data.sip_trunk_id} onChange={(e) => form.setData('sip_trunk_id', e.target.value)}>{trunks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                <input className={inputCls} placeholder="Phone (+14155550100)" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <select className={inputCls} value={form.data.direction} onChange={(e) => form.setData('direction', e.target.value)}><option value="inbound">Inbound</option><option value="outbound">Outbound</option><option value="both">Both</option></select>
                    <select className={inputCls} value={form.data.agent_id} onChange={(e) => form.setData('agent_id', e.target.value)}><option value="">No agent</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Import</button></div>
            </form>
        </div>
    );
}

export default function SipIndex({ trunks = [], numbers = [], stats = [], providerTemplates = {}, engines = [], agents = [], limits = {} }) {
    const [modal, setModal] = useState(null);
    const removeTrunk = (t) => { if (confirm(`Remove trunk ${t.name}?`)) router.delete(route('client.sip.trunks.destroy', t.id), { preserveScroll: true }); };
    const removeNumber = (n) => { if (confirm(`Release ${n.e164_number}?`)) router.delete(route('client.sip.numbers.destroy', n.id), { preserveScroll: true }); };

    return (
        <ClientLayout title="SIP Trunks">
            <Head title="SIP Trunks" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">SIP Trunk Engine</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Bring your own SIP trunk for AI inbound/outbound calls.</p></div>
                    <div className="flex gap-2">
                        <button onClick={() => setModal('number')} disabled={trunks.length === 0 || (limits.numbers_used ?? 0) >= (limits.numbers ?? 0)} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 disabled:opacity-40"><Plus className="h-4 w-4" /> Import number</button>
                        <button onClick={() => setModal('trunk')} disabled={(limits.trunks_used ?? 0) >= (limits.trunks ?? 0)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-40"><Plus className="h-4 w-4" /> Add trunk</button>
                    </div>
                </div>

                <PageOverview feature="sip" />

                <SetupGuide guide="sip" />

                <StatCards items={stats} />

                <div>
                    <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Trunks ({limits.trunks_used ?? 0}/{limits.trunks ?? 0})</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {trunks.map((t) => (
                            <div key={t.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div><div className="flex items-center gap-1.5"><Server className="h-4 w-4 text-brand-500" /><p className="font-display font-semibold text-neutral-900 dark:text-white">{t.name}</p></div><p className="mt-1 text-xs capitalize text-neutral-500">{t.provider} · {t.engine} · {t.transport.toUpperCase()}</p></div>
                                    <button onClick={() => removeTrunk(t)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <p className="mt-2 font-mono text-xs text-neutral-400">{t.sip_host}:{t.sip_port}</p>
                                <div className="mt-2 flex gap-2 text-[11px] text-neutral-500">{t.inbound_enabled && <span className="rounded-full bg-signal-100 px-2 py-0.5 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300">inbound</span>}{t.outbound_enabled && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">outbound</span>}<span className="ml-auto">{t.numbers_count} numbers</span></div>
                            </div>
                        ))}
                        {trunks.length === 0 && <div className="col-span-full rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-12 text-center"><Network className="mx-auto mb-2 h-10 w-10 text-neutral-300" /><p className="text-sm text-neutral-500">No SIP trunks. Add one from a provider template.</p></div>}
                    </div>
                </div>

                <div>
                    <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Numbers</h2>
                    <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                        {numbers.length > 0 ? (
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm"><tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {numbers.map((n) => (
                                    <tr key={n.id}><td className="px-4 py-2.5"><div className="flex items-center gap-2"><PhoneIncoming className="h-4 w-4 text-neutral-400" /><span className="font-mono font-medium text-neutral-900 dark:text-white">{n.e164_number}</span></div></td><td className="px-4 py-2.5 capitalize text-neutral-500">{n.direction} · {n.trunk}</td><td className="px-4 py-2.5 text-neutral-500">{n.agent || 'No agent'}</td><td className="px-4 py-2.5 text-right"><button onClick={() => removeNumber(n)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></td></tr>
                                ))}
                            </tbody></table>
                        ) : <p className="px-4 py-8 text-center text-sm text-neutral-500">No SIP numbers imported.</p>}
                    </div>
                </div>
            </div>

            {modal === 'trunk' && <TrunkModal templates={providerTemplates} engines={engines} onClose={() => setModal(null)} />}
            {modal === 'number' && <NumberModal trunks={trunks} agents={agents} onClose={() => setModal(null)} />}
        </ClientLayout>
    );
}
