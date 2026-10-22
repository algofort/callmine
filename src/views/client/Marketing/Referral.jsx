'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, router, useForm, usePage } from '@/lib/page-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CalendarDays,
    Download,
    Gift,
    LineChart,
    Percent,
    Save,
    Search,
    Settings,
    TrendingUp,
    Users,
    DollarSign,
} from 'lucide-react';
import { Button, Card, Input, TablePagePagination, ThemedSelect, Toggle } from '@/components/ui';
import PageOverview from '@/components/PageOverview';

const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

function formatMoney(amount) {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount));
    } catch {
        return `$${Number(amount).toFixed(2)}`;
    }
}

function StatCard({ title, value, icon: Icon }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
                {Icon ? <Icon className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" strokeWidth={1.75} aria-hidden /> : null}
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
        </div>
    );
}

const STATUS_KEYS = ['pending', 'successful', 'expired', 'cancelled'];

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    successful: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    expired: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100',
    cancelled: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200',
};

const PIE_COLORS = {
    pending: '#94a3b8',
    successful: '#14b8a6',
    expired: '#cbd5e1',
    cancelled: '#f87171',
};

export default function Referral({
    tab: tabProp = 'settings',
    settings = {},
    referralStats = {},
    referrals: referralsProp,
    analytics = {},
    filters = {},
}) {
    const referrals = referralsProp ?? { data: [], current_page: 1, last_page: 1, total: 0 };
    const { flash } = usePage().props;
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.referral_ui.${key}`, opts);

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [statusSel, setStatusSel] = useState(filters.status ?? '');

    useEffect(() => {
        setSearchInput(filters.search ?? '');
        setStatusSel(filters.status ?? '');
    }, [filters.search, filters.status]);

    const tab = tabProp;

    const form = useForm({
        enabled: settings.enabled ?? true,
        reward_type: settings.reward_type ?? 'percentage',
        reward_value: String(settings.reward_value ?? 10),
        referred_user_discount: String(settings.referred_user_discount ?? 10),
        min_order_amount: String(settings.min_order_amount ?? 0),
        expiry_days: String(settings.expiry_days ?? 90),
        terms: settings.terms ?? '',
    });

    useEffect(() => {
        form.reset({
            enabled: settings.enabled ?? true,
            reward_type: settings.reward_type ?? 'percentage',
            reward_value: String(settings.reward_value ?? 10),
            referred_user_discount: String(settings.referred_user_discount ?? 10),
            min_order_amount: String(settings.min_order_amount ?? 0),
            expiry_days: String(settings.expiry_days ?? 90),
            terms: settings.terms ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        settings.enabled,
        settings.reward_type,
        settings.reward_value,
        settings.referred_user_discount,
        settings.min_order_amount,
        settings.expiry_days,
        settings.terms,
    ]);

    const goTab = (id) => {
        if (id === tab) return;
        const params = { tab: id };
        if (id === 'referrals') {
            params.page = 1;
            params.search = searchInput.trim() || undefined;
            params.status = statusSel || undefined;
        }
        router.get(route('client.marketing.referral'), params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const loadReferralsPage = (page = 1) => {
        router.get(
            route('client.marketing.referral'),
            {
                tab: 'referrals',
                page,
                search: searchInput.trim() || undefined,
                status: statusSel || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const applyReferralFilters = (e) => {
        e?.preventDefault?.();
        router.get(
            route('client.marketing.referral'),
            {
                tab: 'referrals',
                page: 1,
                search: searchInput.trim() || undefined,
                status: statusSel || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const saveSettings = (e) => {
        e.preventDefault();
        form.put(route('client.marketing.referral.settings.update'), {
            preserveScroll: true,
        });
    };

    const exportCsv = () => {
        const params = new URLSearchParams();
        if (searchInput.trim()) params.set('search', searchInput.trim());
        if (statusSel) params.set('status', statusSel);
        const q = params.toString();
        window.location.href = route('client.marketing.referral.export') + (q ? `?${q}` : '');
    };

    const statusLabel = (s) => ui(`status_${s}`);

    const statusFilterOptions = [
        { value: '', label: ui('filter_all_status') },
        ...STATUS_KEYS.map((k) => ({ value: k, label: ui(`status_${k}`) })),
    ];

    const rows = referrals?.data ?? [];
    const currentPage = referrals?.current_page ?? 1;
    const lastPage = referrals?.last_page ?? 1;

    const stats = {
        total_referrals: referralStats.total_referrals ?? 0,
        conversion_rate: referralStats.conversion_rate ?? 0,
        total_rewards: referralStats.total_rewards ?? 0,
        pending_payouts: referralStats.pending_payouts ?? 0,
    };

    const monthly = analytics.monthly_growth ?? [];
    const maxMonthly = Math.max(1, ...monthly.map((m) => m.count ?? 0));
    const topReferrers = analytics.top_referrers ?? [];
    const maxTop = Math.max(1, ...topReferrers.map((r) => r.count ?? 0));

    const pieGradient = useMemo(() => {
        const pct = analytics.status_distribution_pct ?? {};
        let deg = 0;
        const parts = [];
        STATUS_KEYS.forEach((st) => {
            const p = ((pct[st] ?? 0) / 100) * 360;
            if (p <= 0) return;
            const color = PIE_COLORS[st] ?? '#e5e7eb';
            parts.push(`${color} ${deg}deg ${deg + p}deg`);
            deg += p;
        });
        if (parts.length === 0) {
            return 'conic-gradient(#e5e7eb 0deg 360deg)';
        }
        return `conic-gradient(${parts.join(', ')})`;
    }, [analytics.status_distribution_pct]);

    const monthlyPoints = useMemo(() => {
        if (!monthly.length) return '';
        const w = 100;
        const h = 44;
        const pts = monthly.map((m, i) => {
            const x = monthly.length <= 1 ? 50 : (i / (monthly.length - 1)) * w;
            const y = 4 + h - (m.count / maxMonthly) * h;
            return `${x},${y}`;
        });
        return pts.join(' ');
    }, [monthly, maxMonthly]);

    const pageTitle = ui('page_title');

    const tabBtn = (id, label, Icon) => {
        const active = tab === id;
        return (
            <button
                type="button"
                onClick={() => goTab(id)}
                className={[
                    'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                    active
                        ? 'border-neutral-200 bg-white text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                ].join(' ')}
            >
                {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden /> : null}
                {label}
            </button>
        );
    };

    const rewardValueLabel =
        form.data.reward_type === 'percentage' ? ui('reward_value_pct') : ui('reward_value_usd');

    return (
        <ClientLayout title={pageTitle}>
            <Head title={pageTitle} />
            <div className="w-full max-w-none space-y-6">
                {flash?.success && (
                    <div className="rounded-soft-lg bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                            <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-3xl">{pageTitle}</h1>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('page_subtitle')}</p>
                        </div>
                    </div>
                </div>

                <PageOverview feature="referral" />

                <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100/90 p-1 dark:border-neutral-700 dark:bg-neutral-800/80 sm:justify-start">
                    {tabBtn('settings', ui('tab_settings'), Settings)}
                    {tabBtn('referrals', ui('tab_referrals'), Users)}
                    {tabBtn('analytics', ui('tab_analytics'), LineChart)}
                </div>

                {tab === 'settings' && (
                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{ui('settings_card_title')}</h2>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('settings_card_subtitle')}</p>
                        </div>
                        <form onSubmit={saveSettings} className="space-y-6 px-6 py-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{ui('enable_program')}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{ui('enable_program_desc')}</p>
                                </div>
                                <Toggle
                                    checked={form.data.enabled}
                                    onChange={(v) => form.setData('enabled', v)}
                                    activeVariant="teal"
                                />
                            </div>

                            <div>
                                <p className={labelClass}>{ui('reward_type')}</p>
                                <div className="mt-2 flex flex-wrap gap-4">
                                    <label className="inline-flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="reward_type"
                                            className="h-4 w-4 border-neutral-300 text-teal-600 focus:ring-teal-500/30"
                                            checked={form.data.reward_type === 'percentage'}
                                            onChange={() => form.setData('reward_type', 'percentage')}
                                        />
                                        <span className="text-sm text-neutral-800 dark:text-neutral-200">{ui('reward_percentage')}</span>
                                    </label>
                                    <label className="inline-flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="reward_type"
                                            className="h-4 w-4 border-neutral-300 text-teal-600 focus:ring-teal-500/30"
                                            checked={form.data.reward_type === 'fixed'}
                                            onChange={() => form.setData('reward_type', 'fixed')}
                                        />
                                        <span className="text-sm text-neutral-800 dark:text-neutral-200">{ui('reward_fixed')}</span>
                                    </label>
                                </div>
                            </div>

                            <Input
                                label={rewardValueLabel}
                                value={form.data.reward_value}
                                onChange={(e) => form.setData('reward_value', e.target.value)}
                                inputMode="decimal"
                                error={form.errors.reward_value}
                            />

                            <Input
                                label={ui('referred_discount_pct')}
                                value={form.data.referred_user_discount}
                                onChange={(e) => form.setData('referred_user_discount', e.target.value)}
                                inputMode="decimal"
                                error={form.errors.referred_user_discount}
                            />

                            <Input
                                label={ui('min_order_amount')}
                                value={form.data.min_order_amount}
                                onChange={(e) => form.setData('min_order_amount', e.target.value)}
                                inputMode="decimal"
                                error={form.errors.min_order_amount}
                            />

                            <Input
                                label={ui('expiry_days')}
                                value={form.data.expiry_days}
                                onChange={(e) => form.setData('expiry_days', e.target.value)}
                                inputMode="numeric"
                                error={form.errors.expiry_days}
                            />

                            <div>
                                <label htmlFor="referral-terms" className={labelClass}>
                                    {ui('terms_label')}
                                </label>
                                <textarea
                                    id="referral-terms"
                                    rows={5}
                                    placeholder={ui('terms_placeholder')}
                                    className="mt-1.5 w-full rounded-soft border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-inner placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                                    value={form.data.terms}
                                    onChange={(e) => form.setData('terms', e.target.value)}
                                />
                                {form.errors.terms ? (
                                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{form.errors.terms}</p>
                                ) : null}
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={form.processing}
                                    className="gap-2 bg-teal-500 shadow-soft hover:bg-teal-600 focus:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500"
                                >
                                    <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                    {ui('save_settings')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {tab === 'referrals' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard title={ui('stat_total_referrals')} value={stats.total_referrals} icon={Users} />
                            <StatCard title={ui('stat_conversion')} value={`${Number(stats.conversion_rate).toFixed(1)}%`} icon={Percent} />
                            <StatCard title={ui('stat_total_rewards')} value={formatMoney(stats.total_rewards)} icon={DollarSign} />
                            <StatCard title={ui('stat_pending_payouts')} value={formatMoney(stats.pending_payouts)} icon={DollarSign} />
                        </div>

                        <Card className="overflow-hidden p-0">
                            <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{ui('list_title')}</h2>
                                <div className="flex flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                                    <form onSubmit={applyReferralFilters} className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                                            <Input
                                                className="pl-9"
                                                placeholder={ui('search_placeholder')}
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                            />
                                        </div>
                                        <ThemedSelect
                                            value={statusSel}
                                            onChange={(v) => {
                                                setStatusSel(v);
                                                router.get(
                                                    route('client.marketing.referral'),
                                                    {
                                                        tab: 'referrals',
                                                        page: 1,
                                                        search: searchInput.trim() || undefined,
                                                        status: v || undefined,
                                                    },
                                                    { preserveState: true, replace: true },
                                                );
                                            }}
                                            options={statusFilterOptions}
                                        />
                                        <Button type="submit" variant="outline" size="md" className="shrink-0">
                                            {t('common.search')}
                                        </Button>
                                    </form>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="md"
                                        className="gap-2"
                                        onClick={exportCsv}
                                    >
                                        <Download className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                        {ui('export_csv')}
                                    </Button>
                                </div>
                            </div>

                            {rows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                    <Users className="h-14 w-14 text-neutral-200 dark:text-neutral-700" strokeWidth={1.25} aria-hidden />
                                    <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{ui('empty_title')}</p>
                                    <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{ui('empty_subtitle')}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                            <tr>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_code')}</th>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_referrer')}</th>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_referred')}</th>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_status')}</th>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_reward')}</th>
                                                <th className="px-4 py-3 sm:px-6">{ui('col_created')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="border-b border-neutral-100 dark:border-neutral-800/80"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs text-neutral-800 dark:text-neutral-200 sm:px-6">
                                                        {row.referral_code}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 sm:px-6">
                                                        {row.referrer_obfuscated}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 sm:px-6">
                                                        {row.referred_obfuscated}
                                                    </td>
                                                    <td className="px-4 py-3 sm:px-6">
                                                        <span
                                                            className={[
                                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                                STATUS_COLORS[row.status] ?? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
                                                            ].join(' ')}
                                                        >
                                                            {statusLabel(row.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 tabular-nums text-neutral-800 dark:text-neutral-200 sm:px-6">
                                                        {formatMoney(row.reward_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 sm:px-6">
                                                        {row.created_label ?? '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {rows.length > 0 && (
                                <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                                    <TablePagePagination
                                        currentPage={currentPage}
                                        lastPage={lastPage}
                                        onPageChange={loadReferralsPage}
                                    />
                                </div>
                            )}
                        </Card>
                    </>
                )}

                {tab === 'analytics' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title={ui('analytics_conversion')}
                                value={`${Number(analytics.conversion_rate ?? 0).toFixed(1)}%`}
                                icon={Percent}
                            />
                            <StatCard
                                title={ui('analytics_avg_reward')}
                                value={formatMoney(analytics.avg_reward ?? 0)}
                                icon={DollarSign}
                            />
                            <StatCard
                                title={ui('analytics_avg_time')}
                                value={
                                    analytics.avg_time_to_convert != null
                                        ? `${analytics.avg_time_to_convert} ${ui('unit_days')}`
                                        : ui('dash')
                                }
                                icon={TrendingUp}
                            />
                            <StatCard
                                title={ui('analytics_most_active_month')}
                                value={analytics.most_active_month ?? ui('dash')}
                                icon={CalendarDays}
                            />
                        </div>

                        <Card className="p-6">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{ui('chart_monthly_title')}</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('chart_monthly_subtitle')}</p>
                                <div className="mt-6 rounded-soft-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
                                {monthly.length > 0 ? (
                                    <svg viewBox="0 0 100 52" className="h-48 w-full text-teal-500" preserveAspectRatio="none" aria-hidden>
                                        <polyline
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            vectorEffect="non-scaling-stroke"
                                            points={monthlyPoints}
                                        />
                                    </svg>
                                ) : (
                                    <div className="flex h-48 items-center justify-center text-sm text-neutral-400">{ui('dash')}</div>
                                )}
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="inline-block h-0.5 w-6 bg-teal-500" aria-hidden />
                                    {ui('chart_legend_total')}
                                </div>
                            </div>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="p-6">
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{ui('chart_top_title')}</h3>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('chart_top_subtitle')}</p>
                                <div className="mt-6 space-y-3">
                                    {topReferrers.length === 0 ? (
                                        <p className="text-center text-sm text-neutral-400">{ui('dash')}</p>
                                    ) : (
                                        topReferrers.map((r, i) => (
                                            <div key={i} className="flex items-end gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">{r.email_obfuscated}</p>
                                                    <div className="mt-1 h-8 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                                                        <div
                                                            className="h-full rounded-md bg-teal-500/90 transition-all"
                                                            style={{ width: `${((r.count ?? 0) / maxTop) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-300">{r.count}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{ui('chart_status_title')}</h3>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('chart_status_subtitle')}</p>
                                <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                                    <div
                                        className="h-40 w-40 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700"
                                        style={{ background: pieGradient }}
                                        role="img"
                                        aria-label={ui('chart_status_title')}
                                    />
                                    <ul className="space-y-2 text-sm">
                                        {STATUS_KEYS.map((st) => (
                                            <li key={st} className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 shrink-0 rounded-sm"
                                                    style={{ background: PIE_COLORS[st] }}
                                                    aria-hidden
                                                />
                                                <span className="text-neutral-700 dark:text-neutral-200">
                                                    {statusLabel(st)}: {analytics.status_distribution?.[st] ?? 0} (
                                                    {analytics.status_distribution_pct?.[st] ?? 0}%)
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </ClientLayout>
    );
}
