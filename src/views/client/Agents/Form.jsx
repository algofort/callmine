'use client';

import { route } from '@/lib/route';
import { Head, Link, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import { Bot, ArrowLeft, Coins } from 'lucide-react';

function Field({ label, error, children, hint }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
        </label>
    );
}

export default function AgentForm({ agent, voices = [], llmModels = [], voiceCostCents = 10, tones = [], personalities = [], promptTemplates = [], engines = [], defaultEngine = 'elevenlabs_twilio' }) {
    const { t } = useTranslation();
    const editing = Boolean(agent?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: agent?.name || '',
        voice_id: agent?.voice_id || '',
        language: agent?.language || 'en',
        engine: agent?.engine || defaultEngine,
        llm_model: agent?.llm_model || (llmModels[0]?.value ?? 'gpt-4o-mini'),
        temperature: agent?.temperature ?? 0.7,
        tone: agent?.tone || '',
        personality: agent?.personality || '',
        system_prompt: agent?.system_prompt || '',
        greeting: agent?.greeting || '',
        status: agent?.status || 'draft',
    });

    const model = llmModels.find((m) => m.value === data.llm_model);
    const llmCost = model?.cost_cents_per_min ?? 0;
    const totalCost = voiceCostCents + llmCost;

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('client.agents.update', agent.id));
        else post(route('client.agents.store'));
    };

    const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

    return (
        <ClientLayout title={editing ? 'Edit agent' : 'New agent'}>
            <Head title={editing ? 'Edit agent' : 'New agent'} />
            <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center gap-3">
                    <Link href={route('client.agents.index')} className="rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /></Link>
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-white">{editing ? 'Edit agent' : 'New agent'}</h1>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Agent name" error={errors.name}>
                                <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Lead Qualifier" />
                            </Field>
                            <Field label="Status" error={errors.status}>
                                <select className={inputCls} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                    <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
                                </select>
                            </Field>
                            <Field label="Voice" error={errors.voice_id}>
                                <select className={inputCls} value={data.voice_id} onChange={(e) => setData('voice_id', e.target.value)}>
                                    <option value="">Select a voice…</option>
                                    {voices.map((v) => <option key={v.id} value={v.id}>{v.name}{v.accent ? ` · ${v.accent}` : ''}</option>)}
                                </select>
                            </Field>
                            <Field label="Language" error={errors.language}>
                                <input className={inputCls} value={data.language} onChange={(e) => setData('language', e.target.value)} placeholder="en" />
                            </Field>
                            <Field label="LLM model" error={errors.llm_model}>
                                <select className={inputCls} value={data.llm_model} onChange={(e) => setData('llm_model', e.target.value)}>
                                    {llmModels.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Engine" error={errors.engine} hint="Voice provider + telephony carrier">
                                <select className={inputCls} value={data.engine} onChange={(e) => setData('engine', e.target.value)}>
                                    {engines.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                                </select>
                            </Field>
                            <Field label={`Temperature — ${Number(data.temperature).toFixed(1)}`} error={errors.temperature} hint="Deterministic ← → Creative">
                                <input type="range" min="0" max="1" step="0.1" value={data.temperature} onChange={(e) => setData('temperature', Number(e.target.value))} className="w-full accent-brand-600" />
                            </Field>
                            <Field label="Voice tone" error={errors.tone}>
                                <select className={inputCls} value={data.tone} onChange={(e) => setData('tone', e.target.value)}>
                                    <option value="">—</option>{tones.map((x) => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </Field>
                            <Field label="Personality" error={errors.personality}>
                                <select className={inputCls} value={data.personality} onChange={(e) => setData('personality', e.target.value)}>
                                    <option value="">—</option>{personalities.map((x) => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </Field>
                        </div>

                        <Field label="Greeting" error={errors.greeting}>
                            <input className={inputCls} value={data.greeting} onChange={(e) => setData('greeting', e.target.value)} placeholder="Hi, this is your AI assistant…" />
                        </Field>

                        <Field label="System prompt" error={errors.system_prompt}>
                            <div className="mb-2 flex flex-wrap gap-1.5">
                                {promptTemplates.map((tpl) => (
                                    <button type="button" key={tpl.label} onClick={() => setData('system_prompt', tpl.prompt)} className="rounded-full bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100">{tpl.label}</button>
                                ))}
                            </div>
                            <textarea rows="6" className={inputCls} value={data.system_prompt} onChange={(e) => setData('system_prompt', e.target.value)} placeholder="Describe how the agent should behave on the call…" />
                        </Field>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300"><Coins className="h-4 w-4" /><span className="text-sm font-semibold">Cost per minute</span></div>
                            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">${(totalCost / 100).toFixed(3)}</p>
                            <dl className="mt-3 space-y-1 text-xs text-neutral-500">
                                <div className="flex justify-between"><dt>Voice (ElevenLabs)</dt><dd className="font-mono">${(voiceCostCents / 100).toFixed(3)}</dd></div>
                                <div className="flex justify-between"><dt>LLM ({model?.label})</dt><dd className="font-mono">${(llmCost / 100).toFixed(3)}</dd></div>
                            </dl>
                            <p className="mt-3 text-[11px] text-neutral-400">≈ 1 credit per minute of talk time.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="flex-1 rounded-soft bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{editing ? 'Save agent' : 'Create agent'}</button>
                            <Link href={route('client.agents.index')} className="rounded-soft border border-neutral-200 dark:border-ink-700 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800">Cancel</Link>
                        </div>
                    </div>
                </div>
            </form>
        </ClientLayout>
    );
}
