'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router } from '@/lib/page-router';
import axios from 'axios';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Phone, Plus, Trash2, Search, X, PhoneCall, ArrowRightLeft } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function BuyModal({ twilioConfigured, onClose }) {
    const [tab, setTab] = useState(twilioConfigured ? 'search' : 'manual');
    const [q, setQ] = useState({ country: 'US', area_code: '', type: 'local' });
    const [results, setResults] = useState([]);
    const [manual, setManual] = useState({ phone: '', type: 'local', country: 'US' });
    const search = async () => { const { data } = await axios.post(route('admin.phone-pool.search'), q); setResults(data.numbers || []); if (data.error) alert(data.error); };
    const buy = (p) => router.post(route('admin.phone-pool.buy'), p, { preserveScroll: true, onSuccess: onClose });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Add system number</h3><button onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <div className="mb-4 flex gap-1.5"><button onClick={() => setTab('search')} disabled={!twilioConfigured} className={`flex-1 rounded-soft px-3 py-1.5 text-sm ${tab === 'search' ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 disabled:opacity-40'}`}>Search Twilio</button><button onClick={() => setTab('manual')} className={`flex-1 rounded-soft px-3 py-1.5 text-sm ${tab === 'manual' ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700'}`}>Add manually</button></div>
                {tab === 'search' ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2"><input className={inputCls} maxLength={2} value={q.country} onChange={(e) => setQ({ ...q, country: e.target.value.toUpperCase() })} placeholder="US" /><input className={inputCls} value={q.area_code} onChange={(e) => setQ({ ...q, area_code: e.target.value })} placeholder="Area" /><select className={inputCls} value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}><option value="local">Local</option><option value="toll_free">Toll-free</option><option value="mobile">Mobile</option></select></div>
                        <button onClick={search} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Search className="h-4 w-4" /> Search</button>
                        <div className="max-h-56 space-y-1.5 overflow-auto">{results.map((n) => <div key={n.e164} className="flex items-center justify-between rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2"><span className="font-mono text-sm">{n.e164}</span><button onClick={() => buy({ phone: n.e164, type: q.type, country: n.country })} className="rounded-soft bg-brand-600 px-3 py-1 text-xs text-white">Buy</button></div>)}</div>
                    </div>
                ) : (
                    <div className="space-y-3"><input className={inputCls} placeholder="+14155550100" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} /><div className="grid grid-cols-2 gap-2"><select className={inputCls} value={manual.type} onChange={(e) => setManual({ ...manual, type: e.target.value })}><option value="local">Local</option><option value="toll_free">Toll-free</option><option value="mobile">Mobile</option></select><input className={inputCls} maxLength={2} value={manual.country} onChange={(e) => setManual({ ...manual, country: e.target.value.toUpperCase() })} /></div><button onClick={() => buy(manual)} disabled={!manual.phone} className="w-full rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Add</button></div>
                )}
            </div>
        </div>
    );
}

export default function PhonePoolIndex({ numbers = [], assigned = [], customers = [], twilioConfigured, stats = [] }) {
    const [buying, setBuying] = useState(false);
    const assign = (n, clientId) => { if (clientId) router.post(route('admin.phone-pool.assign', n.id), { client_id: clientId }, { preserveScroll: true }); };
    const release = (n) => { if (confirm(`Release ${n.e164_number}?`)) router.delete(route('admin.phone-pool.release', n.id), { preserveScroll: true }); };

    return (
        <AdminLayout title="Phone Pool">
            <Head title="Phone Pool" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">System Phone Pool</h2><p className="text-sm text-neutral-500">{numbers.length} available · {assigned.length} assigned</p></div>
                    <button onClick={() => setBuying(true)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Add number</button>
                </div>
                <PageOverview feature="admin-phone-pool" />
                <StatCards items={stats} />
                {!twilioConfigured && <div className="rounded-soft-lg border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">Twilio not configured — search disabled; add numbers manually.</div>}

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50"><tr>{['Number', 'Type', 'Cost', 'Assign to customer', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {numbers.map((n) => (
                                <tr key={n.id}>
                                    <td className="px-4 py-3"><div className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-brand-500" /><span className="font-mono font-medium text-neutral-900 dark:text-white">{n.e164_number}</span></div></td>
                                    <td className="px-4 py-3 capitalize text-neutral-500">{n.type?.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 font-mono text-neutral-500">{n.monthly_cost_credits} cr/mo</td>
                                    <td className="px-4 py-3"><select defaultValue="" onChange={(e) => assign(n, e.target.value)} className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-2 py-1 text-xs"><option value="">— assign —</option>{customers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></td>
                                    <td className="px-4 py-3 text-right"><button onClick={() => release(n)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></td>
                                </tr>
                            ))}
                            {numbers.length === 0 && <tr><td colSpan="5" className="px-4 py-12 text-center text-neutral-500"><Phone className="mx-auto mb-2 h-10 w-10 text-neutral-300" />Pool is empty.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {assigned.length > 0 && (
                    <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase text-neutral-500"><ArrowRightLeft className="h-4 w-4" /> Assigned</h3>
                        <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm"><tbody className="divide-y divide-neutral-100 dark:divide-ink-800">{assigned.map((n) => <tr key={n.id}><td className="px-4 py-2.5 font-mono text-neutral-900 dark:text-white">{n.e164_number}</td><td className="px-4 py-2.5 text-neutral-500">{n.customer}</td></tr>)}</tbody></table>
                        </div>
                    </div>
                )}
            </div>
            {buying && <BuyModal twilioConfigured={twilioConfigured} onClose={() => setBuying(false)} />}
        </AdminLayout>
    );
}
