'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router } from '@/lib/page-router';
import axios from 'axios';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import KycGate from '@/components/KycGate';
import { Phone, Plus, Trash2, Search, X, PhoneCall } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function BuyModal({ twilioConfigured, cost, onClose }) {
    const [tab, setTab] = useState(twilioConfigured ? 'search' : 'manual');
    const [q, setQ] = useState({ country: 'US', area_code: '', type: 'local' });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manual, setManual] = useState({ phone: '', friendly_name: '', type: 'local', country: 'US' });

    const search = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(route('client.phone-numbers.search'), q);
            setResults(data.numbers || []);
            if (data.error) alert(data.error);
        } finally { setLoading(false); }
    };
    const buy = (payload) => router.post(route('client.phone-numbers.buy'), payload, { preserveScroll: true, onSuccess: onClose });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Add a phone number</h3>
                    <button onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button>
                </div>
                <div className="mb-4 flex gap-1.5">
                    <button onClick={() => setTab('search')} disabled={!twilioConfigured} className={`flex-1 rounded-soft px-3 py-1.5 text-sm ${tab === 'search' ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-40'}`}>Buy new (search)</button>
                    <button onClick={() => setTab('manual')} className={`flex-1 rounded-soft px-3 py-1.5 text-sm ${tab === 'manual' ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>Use number I own</button>
                </div>
                <p className="mb-3 text-xs text-neutral-500">Active numbers cost <span className="font-mono">{cost}</span> credits/month.</p>

                {tab === 'search' ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <input className={inputCls} placeholder="Country (US)" maxLength={2} value={q.country} onChange={(e) => setQ({ ...q, country: e.target.value.toUpperCase() })} />
                            <input className={inputCls} placeholder="Area code" value={q.area_code} onChange={(e) => setQ({ ...q, area_code: e.target.value })} />
                            <select className={inputCls} value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}><option value="local">Local</option><option value="toll_free">Toll-free</option><option value="mobile">Mobile</option></select>
                        </div>
                        <button onClick={search} disabled={loading} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Search className="h-4 w-4" /> {loading ? 'Searching…' : 'Search'}</button>
                        <div className="max-h-60 space-y-1.5 overflow-auto">
                            {results.map((n) => (
                                <div key={n.e164} className="flex items-center justify-between rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2">
                                    <div><p className="font-mono text-sm text-neutral-900 dark:text-white">{n.e164}</p><p className="text-xs text-neutral-500">{[n.locality, n.region].filter(Boolean).join(', ')}</p></div>
                                    <button onClick={() => buy({ phone: n.e164, type: q.type, country: n.country })} className="rounded-soft bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500">Buy</button>
                                </div>
                            ))}
                            {results.length === 0 && !loading && <p className="py-4 text-center text-xs text-neutral-400">Search to find available numbers.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="rounded-soft bg-neutral-50 dark:bg-ink-800 px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                            Enter a number you <span className="font-medium">already own</span> — a Twilio number in the platform account (including a trial number), or an external/BYO number. No purchase is made.
                        </p>
                        <input className={inputCls} placeholder="Phone (+14155550123)" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} />
                        <input className={inputCls} placeholder="Friendly name (optional)" value={manual.friendly_name} onChange={(e) => setManual({ ...manual, friendly_name: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                            <select className={inputCls} value={manual.type} onChange={(e) => setManual({ ...manual, type: e.target.value })}><option value="local">Local</option><option value="toll_free">Toll-free</option><option value="mobile">Mobile</option></select>
                            <input className={inputCls} placeholder="Country (US)" maxLength={2} value={manual.country} onChange={(e) => setManual({ ...manual, country: e.target.value.toUpperCase() })} />
                        </div>
                        <button onClick={() => buy({ ...manual, owned: true })} disabled={!manual.phone} className="inline-flex w-full items-center justify-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Plus className="h-4 w-4" /> Add number</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PhoneNumbersIndex({ numbers = [], stats = [], twilioConfigured, numberCostCredits = 50, creditBalance = 0, limit = {} }) {
    const { t } = useTranslation();
    const [buying, setBuying] = useState(false);
    const atLimit = limit.limit !== null && limit.usage >= limit.limit;
    const release = (n) => { if (confirm(`Release ${n.e164_number}?`)) router.delete(route('client.phone-numbers.release', n.id), { preserveScroll: true }); };

    return (
        <ClientLayout title={t('nav.phone_numbers') !== 'nav.phone_numbers' ? t('nav.phone_numbers') : 'Phone Numbers'}>
            <Head title="Phone Numbers" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Phone Numbers</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{limit.usage ?? 0}{limit.limit ? ` / ${limit.limit}` : ''} numbers · <span className="font-mono">{creditBalance.toLocaleString()}</span> credits</p>
                    </div>
                    <button onClick={() => setBuying(true)} disabled={atLimit} title={atLimit ? 'Plan limit reached' : ''} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Plus className="h-4 w-4" /> Buy number</button>
                </div>

                <PageOverview feature="phone-numbers" />

                <KycGate action="buy phone numbers" />

                <StatCards items={stats} />

                {!twilioConfigured && (
                    <div className="rounded-soft-lg border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Twilio isn't configured — number search is disabled, but you can still add your own numbers manually.
                    </div>
                )}

                {numbers.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {numbers.map((n) => (
                            <div key={n.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><PhoneCall className="h-4 w-4" /></span>
                                        <div><p className="font-mono font-semibold text-neutral-900 dark:text-white">{n.e164_number}</p><p className="text-xs capitalize text-neutral-500">{n.type?.replace('_', ' ')}{n.country ? ` · ${n.country}` : ''}</p></div>
                                    </div>
                                    <button onClick={() => release(n)} className="text-danger hover:bg-danger/10 rounded-soft p-1.5"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <p className="mt-3 text-xs text-neutral-400">{n.monthly_cost_credits} credits/month{n.twilio_sid ? ' · Twilio' : ' · Manual'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center"><Phone className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No phone numbers yet. Buy one to use as caller ID for your campaigns.</p></div>
                )}
            </div>

            {buying && <BuyModal twilioConfigured={twilioConfigured} cost={numberCostCredits} onClose={() => setBuying(false)} />}
        </ClientLayout>
    );
}
