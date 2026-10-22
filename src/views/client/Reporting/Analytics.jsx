'use client';

import ClientLayout from '@/layouts/ClientLayout';
import { Head } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Users, UserCheck, LifeBuoy, Activity, Inbox } from 'lucide-react';
import { Card } from '@/components/ui';

const axisTick = '#71717a';

function Kpi({ title, value, icon: Icon, tone = 'blue' }) {
    const tint = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
    }[tone];
    return (
        <Card className="flex items-center justify-between gap-3 p-4 sm:p-5 shadow-soft">
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span>
        </Card>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <Card padding={false} className="overflow-hidden shadow-soft">
            <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:px-5">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
            <div className="h-[280px] w-full p-4 sm:p-5">{children}</div>
        </Card>
    );
}

const tooltipStyle = { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };
const FUNNEL_LABELS = { team: 'Team members', tickets: 'Tickets created', open: 'Open tickets' };

export default function Analytics({ analytics = {}, advancedAnalytics = {} }) {
    const { t } = useTranslation();
    const kpis = { ...(analytics.kpis ?? {}), ...(advancedAnalytics.kpis ?? {}) };
    const activityTrend = Array.isArray(analytics.activityTrend) ? analytics.activityTrend : [];
    const ticketStatus = Array.isArray(analytics.ticketStatus) ? analytics.ticketStatus : [];
    const overviewSeries = Array.isArray(advancedAnalytics.overviewSeries) ? advancedAnalytics.overviewSeries : [];
    const activityByDay = Array.isArray(advancedAnalytics.activityByDay) ? advancedAnalytics.activityByDay : [];
    const funnel = Array.isArray(advancedAnalytics.funnel) ? advancedAnalytics.funnel : [];
    const funnelData = funnel.map((f) => ({ name: FUNNEL_LABELS[f.id] || f.id, value: Number(f.value) || 0 }));

    return (
        <ClientLayout title={t('client.analytics') || 'Analytics'}>
            <Head title={t('client.analytics') || 'Analytics'} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('client.analytics') || 'Analytics'}</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('client.analytics_subtitle') || 'Workspace activity, team and support overview'}
                    </p>
                </div>

                {/* KPIs — basic + advanced merged */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <Kpi title={t('client.team_members') || 'Team members'} value={Number(kpis.teamMembers ?? 0).toLocaleString()} icon={Users} />
                    <Kpi title={t('client.active_users_30d') || 'Active users (30d)'} value={Number(kpis.activeUsers30d ?? 0).toLocaleString()} icon={UserCheck} tone="violet" />
                    <Kpi title={t('client.total_tickets') || 'Total tickets'} value={Number(kpis.totalTickets ?? 0).toLocaleString()} icon={Inbox} />
                    <Kpi title={t('client.open_tickets') || 'Open tickets'} value={Number(kpis.openTickets ?? 0).toLocaleString()} icon={LifeBuoy} />
                    <Kpi title={t('client.activity_30d') || 'Activity (30d)'} value={Number(kpis.activity30d ?? 0).toLocaleString()} icon={Activity} tone="violet" />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Panel title={t('client.activity_trend') || 'Activity trend'} subtitle={t('client.activity_trend_subtitle') || 'Audit-log events per month'}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs><linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisTick }} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisTick }} axisLine={false} tickLine={false} width={36} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#actGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Panel>

                    <Panel title={t('client.ticket_status') || 'Ticket status'} subtitle={t('client.ticket_status_subtitle') || 'Support tickets by status'}>
                        {ticketStatus.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">{t('client.no_data') || 'No data yet'}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={ticketStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                        {ticketStatus.map((e, i) => <Cell key={i} fill={e.color || '#64748b'} stroke="transparent" />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </Panel>

                    <Panel title={t('client.weekly_activity') || 'Weekly activity'}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={overviewSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs><linearGradient id="advGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisTick }} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisTick }} axisLine={false} tickLine={false} width={36} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#advGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Panel>

                    <Panel title={t('client.activity_by_day') || 'Activity by day'}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisTick }} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisTick }} axisLine={false} tickLine={false} width={36} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="events" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Panel>
                </div>

                <Card padding={false} className="overflow-hidden shadow-soft">
                    <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:px-5">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('client.support_funnel') || 'Support funnel'}</h3>
                    </div>
                    <div className="h-[260px] w-full p-4 sm:p-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelData} margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: axisTick }} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: axisTick }} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </ClientLayout>
    );
}
