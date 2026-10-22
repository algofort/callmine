'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, Link, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Target, Bot, Users } from 'lucide-react';

const TYPE_LABEL = { lead_qualification: 'Lead Qualification', sales: 'Sales', support: 'Support', survey: 'Survey' };
const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';
const STEPS = [{ n: 1, label: 'Basics', icon: Target }, { n: 2, label: 'Agent & number', icon: Bot }, { n: 3, label: 'Contacts', icon: Users }];

export default function CampaignWizard({ types = [], agents = [], numbers = [], contactsTotal = 0, recentContacts = [], campaign = null }) {
    const { t } = useTranslation();
    const editing = !!campaign;
    const [step, setStep] = useState(1);
    const { data, setData, post, put, processing, errors } = useForm({
        name: campaign?.name ?? '',
        type: campaign?.type ?? 'lead_qualification',
        goal: campaign?.goal ?? '',
        agent_id: campaign?.agent_id ?? '',
        phone_number_id: campaign?.phone_number_id ?? '',
        max_retries: campaign?.max_retries ?? 3,
        retry_delay_minutes: campaign?.retry_delay_minutes ?? 60,
        schedule_start: campaign?.schedule_start ?? '',
        // In edit mode default to the campaign's existing selection, not "all".
        select_all: editing ? false : true,
        contact_ids: campaign?.contact_ids ?? [],
    });

    const toggleContact = (id) => setData('contact_ids', data.contact_ids.includes(id) ? data.contact_ids.filter((x) => x !== id) : [...data.contact_ids, id]);
    const submit = () => editing ? put(route('client.campaigns.update', campaign.id)) : post(route('client.campaigns.store'));
    const canNext = step === 1 ? data.name.trim() && data.type : true;

    return (
        <ClientLayout title={editing ? 'Edit campaign' : 'New campaign'}>
            <Head title={editing ? 'Edit campaign' : 'New campaign'} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                    <Link href={editing ? route('client.campaigns.show', campaign.id) : route('client.campaigns.index')} className="rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /></Link>
                    <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-white">{editing ? 'Edit campaign' : 'New campaign'}</h1>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s.n} className="flex flex-1 items-center gap-2">
                            <div className={`flex items-center gap-2 ${step >= s.n ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400'}`}>
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step > s.n ? 'bg-signal-500 text-white' : step === s.n ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-ink-800'}`}>{step > s.n ? <Check className="h-4 w-4" /> : s.n}</span>
                                <span className="hidden text-sm font-medium sm:inline">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${step > s.n ? 'bg-signal-400' : 'bg-neutral-200 dark:bg-ink-800'}`} />}
                        </div>
                    ))}
                </div>

                <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft space-y-4">
                    {step === 1 && (
                        <>
                            <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Campaign name</span><input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Q3 Lead Outreach" />{errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}</label>
                            <div><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Type</span><div className="grid grid-cols-2 gap-2">{types.map((tp) => <button key={tp} type="button" onClick={() => setData('type', tp)} className={`rounded-soft border px-3 py-2 text-sm ${data.type === tp ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{TYPE_LABEL[tp] || tp}</button>)}</div></div>
                            <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Goal</span><textarea rows="3" className={inputCls} value={data.goal} onChange={(e) => setData('goal', e.target.value)} placeholder="What should the agent achieve on each call?" /></label>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">AI agent</span><select className={inputCls} value={data.agent_id} onChange={(e) => setData('agent_id', e.target.value)}><option value="">Select an agent…</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>{agents.length === 0 && <p className="mt-1 text-xs text-warm">No active agents — create one first.</p>}</label>
                            <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Caller ID (phone number)</span><select className={inputCls} value={data.phone_number_id} onChange={(e) => setData('phone_number_id', e.target.value)}><option value="">Select a number…</option>{numbers.map((n) => <option key={n.id} value={n.id}>{n.e164_number}</option>)}</select>{numbers.length === 0 && <p className="mt-1 text-xs text-warm">No phone numbers — buy one first.</p>}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Max retries</span><input type="number" min="0" max="5" className={inputCls} value={data.max_retries} onChange={(e) => setData('max_retries', Number(e.target.value))} /></label>
                                <label className="block"><span className="mb-1 block text-xs font-medium uppercase text-neutral-500">Start (optional)</span><input type="datetime-local" className={inputCls} value={data.schedule_start} onChange={(e) => setData('schedule_start', e.target.value)} /></label>
                            </div>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <label className="flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2.5"><input type="checkbox" checked={data.select_all} onChange={(e) => setData('select_all', e.target.checked)} /><span className="text-sm text-neutral-700 dark:text-neutral-300">Use all {contactsTotal} contacts</span></label>
                            {!data.select_all && (
                                <div className="max-h-72 space-y-1 overflow-auto rounded-soft border border-neutral-200 dark:border-ink-700 p-2">
                                    {recentContacts.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 rounded-soft px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-ink-800"><input type="checkbox" checked={data.contact_ids.includes(c.id)} onChange={() => toggleContact(c.id)} /><span className="text-sm text-neutral-700 dark:text-neutral-300">{c.name || c.phone}</span><span className="ml-auto font-mono text-xs text-neutral-400">{c.phone}</span></label>
                                    ))}
                                    {recentContacts.length === 0 && <p className="py-4 text-center text-xs text-neutral-400">No contacts yet — import some first.</p>}
                                </div>
                            )}
                            <p className="text-xs text-neutral-500">{editing ? 'Changes apply to the draft/paused campaign. Launch it from its page when ready.' : 'The campaign is saved as a draft. You can launch it from its page when ready.'}</p>
                        </>
                    )}
                </div>

                <div className="flex justify-between">
                    <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
                    {step < 3 ? (
                        <button type="button" onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Next <ArrowRight className="h-4 w-4" /></button>
                    ) : (
                        <button type="button" onClick={submit} disabled={processing} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Check className="h-4 w-4" /> {editing ? 'Save changes' : 'Create draft'}</button>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
