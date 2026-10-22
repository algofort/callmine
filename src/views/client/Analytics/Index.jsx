'use client';

import { route } from '@/lib/route';
import { Head, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Target, TrendingUp, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LEAD_COLORS = { Hot: '#fb5e5e', Warm: '#ffb23e', Cold: '#4fb0ff' };
const SENT_COLORS = { Positive: '#16d9a8', Neutral: '#a1a1aa', Negative: '#fb5e5e' };

function fmtDur(s) { if (!s) return '0:00'; const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }

function Kpi({ icon: Icon, label, value, trend }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
            <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><Icon className="h-4 w-4" /></span>
                {trend !== null && trend !== undefined && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-signal-600 dark:text-signal-400' : 'text-danger'}`}>{trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(trend)}%</span>
                )}
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
        </div>
    );
}

function Card({ title, children }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">{title}</h3>
            {children}
        </div>
    );
}

export default function AnalyticsIndex({ days = 30, kpis = {}, charts = {} }) {
    const { t } = useTranslation();
    const setDays = (d) => router.get(route('client.analytics.index'), { days: d }, { preserveState: true, replace: true });
    const hasLeads = (charts.lead_distribution || []).some((d) => d.value > 0);
    const hasSent = (charts.sentiment || []).some((d) => d.value > 0);

    return (
        <ClientLayout title={t('nav.analytics') !== 'nav.analytics' ? t('nav.analytics') : 'Analytics'}>
            <Head title="Analytics" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Lead intelligence across your campaigns.</p></div>
                    <div className="flex gap-1.5">{[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} className={`rounded-soft px-3 py-1.5 text-xs font-medium ${days === d ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{d}d</button>)}</div>
                </div>

                <PageOverview feature="analytics" />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Kpi icon={PhoneCall} label="Total calls" value={kpis.total_calls ?? 0} trend={kpis.calls_trend} />
                    <Kpi icon={TrendingUp} label="Success rate" value={`${kpis.success_rate ?? 0}%`} />
                    <Kpi icon={Target} label="Qualified leads" value={kpis.qualified_leads ?? 0} trend={kpis.qualified_trend} />
                    <Kpi icon={Clock} label="Avg duration" value={fmtDur(kpis.avg_duration)} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card title="Calls this week">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={charts.calls_by_day || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                                    <Tooltip />
                                    <Bar dataKey="calls" fill="#6d3fea" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                    <Card title="Lead distribution">
                        {hasLeads ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={charts.lead_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                        {charts.lead_distribution.map((e) => <Cell key={e.name} fill={LEAD_COLORS[e.name]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="py-16 text-center text-sm text-neutral-400">No qualified leads yet.</p>}
                        <div className="mt-2 flex justify-center gap-3 text-xs">{(charts.lead_distribution || []).map((e) => <span key={e.name} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LEAD_COLORS[e.name] }} />{e.name} {e.value}</span>)}</div>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Sentiment">
                        {hasSent ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={charts.sentiment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                        {charts.sentiment.map((e) => <Cell key={e.name} fill={SENT_COLORS[e.name]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="py-16 text-center text-sm text-neutral-400">No sentiment data yet.</p>}
                    </Card>
                    <Card title="Campaign success rate">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={charts.campaign_success || []} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Bar dataKey="success" fill="#16d9a8" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </div>
        </ClientLayout>
    );
}
