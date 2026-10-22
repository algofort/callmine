'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, Link } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { PhoneCall, TrendingUp, Target, Clock, Bot, Phone, Users, Megaphone, ArrowRight, ArrowUpRight, CheckCircle2, Circle, Sparkles, Zap } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LEAD_COLORS = { Hot: '#fb5e5e', Warm: '#ffb23e', Cold: '#4fb0ff' };
const SENT = { positive: 'text-signal-600 dark:text-signal-400', neutral: 'text-neutral-500', negative: 'text-danger' };
const STATUS = { completed: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', failed: 'bg-danger/10 text-danger', no_answer: 'bg-neutral-100 text-neutral-500 dark:bg-ink-800', busy: 'bg-warm/20 text-amber-700 dark:text-amber-300' };
const fmtDur = (s) => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`;
const initials = (s = '') => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

// Accent palette — drives the icon tile, top-bar gradient and hover glow per stat.
const ACCENTS = {
    brand: { tile: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', bar: 'from-brand-500 to-brand-300', glow: 'bg-brand-500/25' },
    signal: { tile: 'bg-signal-500/15 text-signal-600 dark:text-signal-300', bar: 'from-signal-500 to-signal-300', glow: 'bg-signal-500/25' },
    warm: { tile: 'bg-warm/15 text-amber-600 dark:text-amber-300', bar: 'from-warm to-amber-300', glow: 'bg-warm/25' },
    cold: { tile: 'bg-cold/15 text-cold', bar: 'from-cold to-sky-300', glow: 'bg-cold/25' },
};

function Stat({ icon: Icon, label, value, sub, accent = 'brand' }) {
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
            {sub && <p className="relative mt-1.5 text-xs text-neutral-500">{sub}</p>}
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

function ResourceCard({ href, icon: Icon, value, label, accent }) {
    const a = ACCENTS[accent];
    return (
        <Link href={href} className="group flex items-center gap-3 rounded-soft-lg border border-neutral-200 bg-white p-3.5 shadow-soft transition duration-250 hover:border-brand-300 hover:shadow-soft-lg dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-500/40">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.tile}`}><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-tight text-neutral-900 dark:text-white">{value}</p>
                <p className="truncate text-xs text-neutral-500">{label}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-brand-500 dark:text-ink-600" />
        </Link>
    );
}

function Onboarding({ steps }) {
    const items = [
        { key: 'has_agent', label: 'Create an AI agent', href: route('client.agents.create') },
        { key: 'has_number', label: 'Add a phone number', href: route('client.phone-numbers.index') },
        { key: 'has_contacts', label: 'Import contacts', href: route('client.contacts.index') },
        { key: 'has_campaign', label: 'Launch a campaign', href: route('client.campaigns.create') },
    ];
    const done = items.filter((i) => steps[i.key]).length;
    if (done === items.length) return null;
    const pct = Math.round((done / items.length) * 100);
    return (
        <div className="relative overflow-hidden rounded-soft-lg border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-soft dark:border-brand-500/30 dark:from-brand-500/10 dark:to-ink-900">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-400/15 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300"><Sparkles className="h-5 w-5" /></span>
                    <div>
                        <h3 className="font-display font-semibold text-neutral-900 dark:text-white">Get started</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Launch your first AI calling campaign.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-brand-100 dark:bg-ink-800"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                    <span className="font-display text-sm font-bold text-brand-700 dark:text-brand-300">{done}/{items.length}</span>
                </div>
            </div>
            <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
                {items.map((i) => (
                    <Link key={i.key} href={i.href} className={`flex items-center gap-2 rounded-soft border px-3 py-2.5 text-sm transition ${steps[i.key] ? 'border-signal-200 bg-signal-50 text-neutral-500 dark:border-signal-500/30 dark:bg-signal-500/10' : 'border-neutral-200 bg-white text-neutral-800 hover:border-brand-300 hover:shadow-soft dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-200'}`}>
                        {steps[i.key] ? <CheckCircle2 className="h-4 w-4 text-signal-500" /> : <Circle className="h-4 w-4 text-neutral-400" />}
                        <span className={steps[i.key] ? 'line-through' : ''}>{i.label}</span>
                        {!steps[i.key] && <ArrowRight className="ml-auto h-4 w-4 text-brand-500" />}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function formatDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return iso; } }

export default function Dashboard({ currentPlan, renewsAt, managedByAdmin, creditBalance = 0, kpis, callsByDay = [], leadDistribution = [], recentCalls = [], activeCampaigns = [], onboarding, isClientAdministrator }) {
    const { t } = useTranslation();
    const hasLeads = leadDistribution.some((d) => d.value > 0);
    const leadTotal = leadDistribution.reduce((s, d) => s + (d.value || 0), 0);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <ClientLayout title={t('client.dashboard') || 'Dashboard'}>
            <Head title={t('client.dashboard') || 'Dashboard'} />
            <div className="space-y-6">
                {/* Hero band */}
                <div className="relative overflow-hidden rounded-soft-xl bg-gradient-to-br from-ink-900 via-brand-800 to-brand-600 p-6 text-white shadow-soft-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-brand-400/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-signal-500/20 blur-3xl" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-brand-100 ring-1 ring-inset ring-white/15"><span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-pulse" /> Live overview</span>
                            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{greeting}</h1>
                            <p className="mt-1 max-w-md text-sm text-brand-100/80">Your AI calling activity over the last 30 days.</p>
                        </div>
                        <Link href={route('client.campaigns.create')} className="inline-flex items-center gap-2 rounded-soft bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-soft transition hover:bg-brand-50 hover:shadow-soft-lg"><Megaphone className="h-4 w-4" /> New campaign</Link>
                    </div>
                </div>

                {onboarding && <Onboarding steps={onboarding} />}

                {/* Credit + KPIs */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="relative overflow-hidden rounded-soft-lg bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-5 text-white shadow-soft-lg">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                        <PhoneCall className="pointer-events-none absolute -bottom-3 -right-2 h-24 w-24 text-white/10" />
                        <div className="relative flex items-center gap-2 text-brand-100"><Zap className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Calling credits</span></div>
                        <p className="relative mt-3 font-mono text-4xl font-bold tabular-nums">{Number(creditBalance).toLocaleString()}</p>
                        <div className="relative mt-4 flex items-center justify-between">
                            <span className="text-xs text-brand-100/90">{currentPlan ? currentPlan.name + ' plan' : 'No active plan'}{renewsAt ? ` · renews ${formatDate(renewsAt)}` : ''}</span>
                            <Link href={route('client.billing.index')} className="rounded-soft bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur transition hover:bg-white/30">Top up</Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-2">
                        <Stat icon={PhoneCall} label="Calls (30d)" value={kpis?.calls_30d ?? 0} accent="brand" />
                        <Stat icon={TrendingUp} label="Success" value={`${kpis?.success_rate ?? 0}%`} accent="signal" />
                        <Stat icon={Target} label="Qualified" value={kpis?.qualified_leads ?? 0} accent="warm" />
                        <Stat icon={Clock} label="Avg call" value={fmtDur(kpis?.avg_duration)} accent="cold" />
                    </div>
                </div>

                {/* Resource counts */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ResourceCard href={route('client.agents.index')} icon={Bot} value={kpis?.agents ?? 0} label="Agents" accent="brand" />
                    <ResourceCard href={route('client.phone-numbers.index')} icon={Phone} value={kpis?.numbers ?? 0} label="Numbers" accent="signal" />
                    <ResourceCard href={route('client.contacts.index')} icon={Users} value={(kpis?.contacts ?? 0).toLocaleString()} label="Contacts" accent="cold" />
                    <ResourceCard href={route('client.campaigns.index')} icon={Megaphone} value={kpis?.active_campaigns ?? 0} label="Active campaigns" accent="warm" />
                </div>

                {/* Charts */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <SectionCard title="Calls this week" className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={callsByDay} barCategoryGap="28%">
                                <defs>
                                    <linearGradient id="cb-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8a67f2" /><stop offset="100%" stopColor="#5a28d6" /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 6" stroke="#e4e4e7" strokeOpacity={0.5} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip cursor={{ fill: 'rgba(109,63,234,0.06)' }} content={<ChartTip />} />
                                <Bar dataKey="calls" fill="url(#cb-bar)" radius={[6, 6, 0, 0]} maxBarSize={46} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>
                    <SectionCard title="Lead distribution">
                        {hasLeads ? (
                            <>
                                <div className="relative mx-auto" style={{ height: 180 }}>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={leadDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={74} paddingAngle={3} stroke="none">
                                                {leadDistribution.map((e) => <Cell key={e.name} fill={LEAD_COLORS[e.name]} />)}
                                            </Pie>
                                            <Tooltip content={<ChartTip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{leadTotal}</span>
                                        <span className="text-[11px] uppercase tracking-wide text-neutral-400">Leads</span>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-center gap-4 text-xs">{leadDistribution.map((e) => <span key={e.name} className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LEAD_COLORS[e.name] }} />{e.name} <span className="font-semibold">{e.value}</span></span>)}</div>
                            </>
                        ) : <p className="py-16 text-center text-sm text-neutral-400">No qualified leads yet.</p>}
                    </SectionCard>
                </div>

                {/* Recent calls + campaigns */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <SectionCard title="Recent calls" pad={false} className="lg:col-span-2" action={<Link href={route('client.calls.index')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">View all <ArrowRight className="h-3 w-3" /></Link>}>
                        {recentCalls.length > 0 ? (
                            <table className="min-w-full divide-y divide-neutral-100 text-sm dark:divide-ink-800">
                                <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                    {recentCalls.map((c) => (
                                        <tr key={c.id} className="transition hover:bg-neutral-50/70 dark:hover:bg-ink-800/40">
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">{initials(c.contact)}</span>
                                                    <span className="font-medium text-neutral-900 dark:text-white">{c.contact}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS[c.status] || 'bg-neutral-100 text-neutral-500 dark:bg-ink-800'}`}>{(c.status || '').replace('_', ' ')}</span></td>
                                            <td className={`px-5 py-2.5 capitalize ${SENT[c.sentiment] || 'text-neutral-400'}`}>{c.sentiment || '—'}</td>
                                            <td className="px-5 py-2.5 text-right font-mono text-neutral-500">{fmtDur(c.duration_seconds)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="px-5 py-12 text-center text-sm text-neutral-400">No calls yet. Launch a campaign to start.</p>}
                    </SectionCard>
                    <SectionCard title="Active campaigns">
                        <div className="space-y-2">
                            {activeCampaigns.map((c) => (
                                <Link key={c.id} href={route('client.campaigns.show', c.id)} className="group flex items-center justify-between rounded-soft border border-neutral-200 px-3 py-2.5 transition hover:border-brand-300 hover:shadow-soft dark:border-ink-700 dark:hover:border-brand-500/40">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm/15 text-amber-600 dark:text-amber-300"><Megaphone className="h-4 w-4" /></span>
                                        <div className="min-w-0"><p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{c.name}</p><p className="text-xs text-neutral-400">{c.contacts_count} contacts</p></div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-ink-600" />
                                </Link>
                            ))}
                            {activeCampaigns.length === 0 && <p className="py-10 text-center text-sm text-neutral-400">No active campaigns.</p>}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </ClientLayout>
    );
}
