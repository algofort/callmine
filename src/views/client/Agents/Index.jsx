'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { useTranslation } from 'react-i18next';
import AgentTabs from '@/components/AgentTabs';
import { Bot, Plus, Pencil, Trash2, AudioLines, Search } from 'lucide-react';
import { useMoney } from '@/lib/money';

const STATUS = {
    active: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    draft: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300',
    archived: 'bg-neutral-100 text-neutral-400 dark:bg-ink-800',
};

export default function AgentsIndex({ agents, stats = [], filters = {}, engines = [] }) {
    const { t } = useTranslation();
    const money = useMoney();
    const [search, setSearch] = useState(filters.search || '');
    const apply = (e) => { e?.preventDefault(); router.get(route('client.agents.index'), { search, engine: filters.engine }, { preserveState: true, replace: true }); };
    const setEngine = (engine) => router.get(route('client.agents.index'), { search, engine }, { preserveState: true, replace: true });
    const remove = (a) => { if (confirm(`Delete agent "${a.name}"?`)) router.delete(route('client.agents.destroy', a.id), { preserveScroll: true }); };

    return (
        <ClientLayout title={t('nav.agents') !== 'nav.agents' ? t('nav.agents') : 'Agents'}>
            <Head title="Agents" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">AI Agents</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Configure the voice agents that run your calling campaigns.</p>
                    </div>
                    <Link href={route('client.agents.create')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New agent</Link>
                </div>

                <AgentTabs active="agents" />
                <PageOverview feature="agents" />
                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={apply} className="relative max-w-xs flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents…" className="w-full rounded-soft border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-ink-700 dark:bg-ink-900" />
                    </form>
                    <select value={filters.engine || ''} onChange={(e) => setEngine(e.target.value)} className="rounded-soft border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900">
                        <option value="">All engines</option>
                        {engines.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>

                {agents.data.length === 0 ? (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center">
                        <Bot className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
                        <p className="text-neutral-500">No agents yet.</p>
                        <Link href={route('client.agents.create')} className="mt-3 inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Create your first agent</Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {agents.data.map((a) => (
                            <div key={a.id} className="flex flex-col rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><Bot className="h-4 w-4" /></span>
                                        <div className="min-w-0">
                                            <p className="truncate font-display font-semibold text-neutral-900 dark:text-white">{a.name}</p>
                                            <p className="text-xs text-neutral-500">{a.llm_model} · {a.language}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[a.status] || STATUS.draft}`}>{a.status}</span>
                                </div>
                                {a.engine_label && (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-300">
                                            <span className="h-2 w-2 rounded-full" style={{ background: a.engine_dot }} />{a.engine_label}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                                    <AudioLines className="h-3.5 w-3.5" /> {a.voice || 'No voice'}
                                    <span className="ml-auto font-mono text-neutral-600 dark:text-neutral-300">{money(a.cost_per_minute_cents, 'USD', { decimals: 3 })}/min</span>
                                </div>
                                <div className="mt-4 flex gap-2 border-t border-neutral-100 dark:border-ink-800 pt-3">
                                    <Link href={route('client.agents.edit', a.id)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                                    <button onClick={() => remove(a)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
