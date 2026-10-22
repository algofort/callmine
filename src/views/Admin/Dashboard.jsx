'use client';

import { route } from '@/lib/route';
import { Link } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Banknote, PhoneCall, Target, TrendingUp, ListChecks, CheckCircle2, XCircle, ArrowRight, ArrowUpRight, Activity } from 'lucide-react';
import { useMoney } from '@/lib/money';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ACCENTS = {
    brand: { tile: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', bar: 'from-brand-500 to-brand-300', glow: 'bg-brand-500/25' },
    signal: { tile: 'bg-signal-500/15 text-signal-600 dark:text-signal-300', bar: 'from-signal-500 to-signal-300', glow: 'bg-signal-500/25' },
    warm: { tile: 'bg-warm/15 text-amber-600 dark:text-amber-300', bar: 'from-warm to-amber-300', glow: 'bg-warm/25' },
    cold: { tile: 'bg-cold/15 text-cold', bar: 'from-cold to-sky-300', glow: 'bg-cold/25' },
};

function Stat({ icon: Icon, label, value, accent = 'brand' }) {
    const a = ACCENTS[accent];
    return (
        <div className="group relative overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft transition duration-250 hover:shadow-soft-lg">
            <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
            <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition duration-250 group-hover:opacity-100 ${a.glow}`} />
            <div className="relative flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.tile}`}><Icon className="h-5 w-5" /></span>
            </div>
            <p className="relative mt-3 font-display text-[26px] font-bold leading-none tabular-nums text-neutral-900 dark:text-white">{value}</p>
        </div>
    );
}

function ChartTip({ active, payload, label, unit = '' }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white/95 px-3 py-1.5 shadow-soft-lg backdrop-blur dark:bg-ink-900/95">
            <p className="text-[11px] font-medium text-neutral-400">{label}</p>
            <p className="font-display text-sm font-bold text-neutral-900 dark:text-white">{payload[0].value}{unit}</p>
        </div>
    );
}

function SectionCard({ title, action, children, className = '', pad = true }) {
    return (
        <div className={`overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-soft ${className}`}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-ink-800">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200"><span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-brand-500 to-brand-300" />{title}</h3>
                {action}
            </div>
            <div className={pad ? 'p-5' : ''}>{children}</div>
        </div>
    );
}

function Health({ ok, label }) {
    return (
        <div className="flex items-center gap-2.5 rounded-soft border border-neutral-200 px-3 py-2.5 dark:border-ink-700">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${ok ? 'bg-signal-500/15 text-signal-600 dark:text-signal-300' : 'bg-neutral-100 text-neutral-400 dark:bg-ink-800'}`}>{ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}</span>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
            <span className={`ml-auto inline-flex items-center gap-1 text-xs font-medium ${ok ? 'text-signal-600 dark:text-signal-400' : 'text-neutral-400'}`}>{ok && <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse" />}{ok ? 'Connected' : 'Not set'}</span>
        </div>
    );
}

export default function AdminDashboard({ kpis = {}, callsByDay = [], serviceHealth = {}, recentCustomers = [], topCustomers = [] }) {
    const { t } = useTranslation();
    const fmtMoney = useMoney();
    // KPI money values arrive as major USD units; convert to cents for the shared formatter.
    const money = (dollars) => fmtMoney(Math.round(Number(dollars || 0) * 100), 'USD');

    return (
        <AdminLayout title={t('admin.dashboard')}>
            <Head title={`${t('admin.dashboard')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                {/* Hero band */}
                <div className="relative overflow-hidden rounded-soft-xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-800 p-6 text-white shadow-soft-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-signal-500/15 blur-3xl" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-brand-100 ring-1 ring-inset ring-white/15"><Activity className="h-3 w-3" /> Platform health</span>
                            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Platform overview</h2>
                            <p className="mt-1 max-w-md text-sm text-brand-100/80">Customers, calling activity and service health at a glance.</p>
                        </div>
                        <div className="rounded-soft-lg bg-white/10 px-4 py-3 text-right ring-1 ring-inset ring-white/15 backdrop-blur">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-100/80">Monthly recurring</p>
                            <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">{money(kpis.mrr)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Stat icon={Building2} label="Customers" value={kpis.customers ?? 0} accent="brand" />
                    <Stat icon={Users} label="Active subs" value={kpis.subscriptions_active ?? 0} accent="cold" />
                    <Stat icon={Banknote} label="MRR" value={money(kpis.mrr)} accent="signal" />
                    <Stat icon={PhoneCall} label="Total calls" value={(kpis.total_calls ?? 0).toLocaleString()} accent="brand" />
                    <Stat icon={Target} label="Qualified leads" value={(kpis.qualified_leads ?? 0).toLocaleString()} accent="warm" />
                    <Stat icon={TrendingUp} label="Success rate" value={`${kpis.success_rate ?? 0}%`} accent="signal" />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <SectionCard title="Calls this week" className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={callsByDay} barCategoryGap="28%">
                                <defs>
                                    <linearGradient id="adm-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8a67f2" /><stop offset="100%" stopColor="#5a28d6" /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 6" stroke="#e4e4e7" strokeOpacity={0.5} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip cursor={{ fill: 'rgba(109,63,234,0.06)' }} content={<ChartTip />} />
                                <Bar dataKey="calls" fill="url(#adm-bar)" radius={[6, 6, 0, 0]} maxBarSize={46} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>
                    <div className="space-y-4">
                        <SectionCard title="Service health">
                            <div className="space-y-2">
                                <Health ok={serviceHealth.twilio} label="Twilio" />
                                <Health ok={serviceHealth.elevenlabs} label="ElevenLabs" />
                                <Health ok={serviceHealth.openai} label="OpenAI" />
                            </div>
                        </SectionCard>
                        <div className="relative overflow-hidden rounded-soft-lg bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-soft-lg">
                            <ListChecks className="pointer-events-none absolute -bottom-3 -right-2 h-24 w-24 text-white/10" />
                            <div className="relative flex items-center gap-2 text-brand-100"><ListChecks className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Queue pending</span></div>
                            <p className="relative mt-2 font-display text-3xl font-bold tabular-nums">{kpis.queue_pending ?? 0}</p>
                            <Link href={route('admin.call-queue.index')} className="relative mt-2 inline-flex items-center gap-1 rounded-soft bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur transition hover:bg-white/30">Manage queue <ArrowRight className="h-3 w-3" /></Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard title="Recent customers" pad={false} action={<Link href={route('admin.clients.index')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">View all <ArrowRight className="h-3 w-3" /></Link>}>
                        <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {recentCustomers.map((v) => (
                                    <tr key={v.id} className="transition hover:bg-neutral-50/70 dark:hover:bg-ink-800/40">
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Building2 className="h-4 w-4" /></span>
                                                <span className="font-medium text-neutral-900 dark:text-white">{v.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] ${v.status === 'active' ? 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300' : 'bg-neutral-100 text-neutral-500 dark:bg-ink-800'}`}>{v.status}</span></td>
                                        <td className="px-5 py-2.5 text-right font-mono text-neutral-600 dark:text-neutral-300">{v.credits.toLocaleString()} cr</td>
                                    </tr>
                                ))}
                                {recentCustomers.length === 0 && <tr><td className="px-5 py-10 text-center text-neutral-500">No customers yet.</td></tr>}
                            </tbody>
                        </table>
                    </SectionCard>
                    <SectionCard title="Top customers by calls">
                        {topCustomers.length > 0 ? (
                            <div className="space-y-3">
                                {topCustomers.map((v, i) => {
                                    const max = topCustomers[0].calls || 1;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm"><span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-500 dark:bg-ink-800 dark:text-neutral-400">{i + 1}</span>{v.name}</span><span className="font-mono text-neutral-500">{v.calls}</span></div>
                                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-ink-800"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500" style={{ width: `${(v.calls / max) * 100}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="py-10 text-center text-sm text-neutral-400">No call activity yet.</p>}
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-ink-800">
                            <Link href={route('admin.plans.index')} className="inline-flex items-center gap-1 rounded-soft bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-ink-800 dark:text-neutral-300 dark:hover:bg-ink-700">{t('admin.plans')} <ArrowUpRight className="h-3 w-3" /></Link>
                            <Link href={route('admin.engines.index')} className="inline-flex items-center gap-1 rounded-soft bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-ink-800 dark:text-neutral-300 dark:hover:bg-ink-700">Engines <ArrowUpRight className="h-3 w-3" /></Link>
                            <Link href={route('admin.payments.index')} className="inline-flex items-center gap-1 rounded-soft bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-ink-800 dark:text-neutral-300 dark:hover:bg-ink-700">Payments <ArrowUpRight className="h-3 w-3" /></Link>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AdminLayout>
    );
}
