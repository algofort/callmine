'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, router, usePage } from '@/lib/page-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3,
    Copy,
    DollarSign,
    Eye,
    Gift,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { Button, Card, Input, ThemedSelect } from '@/components/ui';
import PageOverview from '@/components/PageOverview';
import VoucherDetailsModal from './VoucherDetailsModal';
import VoucherFormModal from './VoucherFormModal';

function formatMoney(amount, currency = 'USD') {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
    } catch {
        return `$${Number(amount).toFixed(2)}`;
    }
}

function formatDateShort(iso, locale) {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale || undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

export default function Vouchers({ stats = {}, vouchers = [] }) {
    const { flash } = usePage().props;
    const { t, i18n } = useTranslation();
    const ui = (key, opts) => t(`client.vouchers_ui.${key}`, opts);
    const locale = i18n.language?.replace('_', '-') || undefined;

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [voucherModal, setVoucherModal] = useState(null);
    const [viewingVoucher, setViewingVoucher] = useState(null);

    const statusOptions = [
        { value: '', label: ui('filter_all_status') },
        { value: 'active', label: ui('status_active') },
        { value: 'inactive', label: ui('status_inactive') },
    ];

    const typeOptions = [
        { value: '', label: ui('filter_all_types') },
        { value: 'percentage', label: ui('type_percentage') },
        { value: 'fixed', label: ui('type_fixed_amount') },
    ];

    const filtered = useMemo(() => {
        let list = [...vouchers];
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter((row) => {
                const hay = [row.code, row.description].filter(Boolean).join(' ').toLowerCase();
                return hay.includes(q);
            });
        }
        if (statusFilter === 'active') {
            list = list.filter((r) => r.status === 'active');
        } else if (statusFilter === 'inactive') {
            list = list.filter((r) => r.status === 'inactive');
        }
        if (typeFilter === 'percentage') {
            list = list.filter((r) => r.discount_type === 'percentage');
        } else if (typeFilter === 'fixed') {
            list = list.filter((r) => r.discount_type === 'fixed');
        }
        return list;
    }, [vouchers, query, statusFilter, typeFilter]);

    const copyCode = (code) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(code);
        }
    };

    const s = {
        total_vouchers: stats.total_vouchers ?? 0,
        active_vouchers: stats.active_vouchers ?? 0,
        total_usage: stats.total_usage ?? 0,
        total_discount_given: stats.total_discount_given ?? 0,
    };

    const pageTitle = ui('page_title');

    return (
        <ClientLayout title={pageTitle}>
            <Head title={pageTitle} />
            <div className="w-full max-w-none space-y-6">
                {flash?.success && (
                    <div className="rounded-soft-lg bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-soft-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {flash.error}
                    </div>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-3xl">{pageTitle}</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('page_subtitle')}</p>
                    </div>
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="shrink-0 gap-2 self-start bg-teal-500 shadow-soft hover:bg-teal-600 focus:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500"
                        onClick={() => setVoucherModal({ mode: 'create' })}
                    >
                        <Plus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                        {ui('create_voucher')}
                    </Button>
                </div>

                <PageOverview feature="vouchers" />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            key: 'total_vouchers',
                            label: ui('stat_total_vouchers'),
                            value: s.total_vouchers,
                            Icon: Gift,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                        {
                            key: 'active_vouchers',
                            label: ui('stat_active_vouchers'),
                            value: s.active_vouchers,
                            Icon: Gift,
                            valueClass: 'text-emerald-600 dark:text-emerald-400',
                            iconClass: 'text-emerald-500 dark:text-emerald-400',
                        },
                        {
                            key: 'total_usage',
                            label: ui('stat_total_usage'),
                            value: s.total_usage,
                            Icon: BarChart3,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                        {
                            key: 'total_discount',
                            label: ui('stat_total_discount'),
                            value: formatMoney(s.total_discount_given),
                            Icon: DollarSign,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                    ].map(({ key, label, value, Icon, valueClass, iconClass }) => (
                        <div
                            key={key}
                            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-700/50 dark:bg-neutral-900/80 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
                                <Icon
                                    className={['h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500', iconClass || ''].join(' ')}
                                    strokeWidth={2}
                                />
                            </div>
                            <p
                                className={[
                                    'mt-3 text-2xl font-bold tabular-nums',
                                    valueClass || 'text-neutral-900 dark:text-white',
                                ].join(' ')}
                            >
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </p>
                        </div>
                    ))}
                </div>

                <Card padding={false} className="overflow-hidden shadow-soft-md">
                    <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:px-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{ui('section_table_title')}</h2>
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:max-w-3xl lg:justify-end">
                                <div className="relative min-w-0 flex-1 sm:min-w-[12rem]">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={ui('search_placeholder')}
                                        className="pl-10"
                                        aria-label={ui('search_placeholder')}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:min-w-0">
                                    <ThemedSelect
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        options={statusOptions}
                                        placeholder={ui('filter_all_status')}
                                    />
                                    <ThemedSelect
                                        value={typeFilter}
                                        onChange={setTypeFilter}
                                        options={typeOptions}
                                        placeholder={ui('filter_all_types')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50/90 dark:border-neutral-800 dark:bg-neutral-900/80">
                                    {['col_code', 'col_discount', 'col_usage', 'col_validity', 'col_status', 'col_actions'].map((col) => (
                                        <th
                                            key={col}
                                            scope="col"
                                            className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-200 sm:px-5"
                                        >
                                            {ui(col)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                            {ui('no_results')}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row) => {
                                        const isActive = row.status === 'active';
                                        const usageLabel =
                                            row.usage_cap != null && row.usage_cap !== ''
                                                ? `${row.usage} / ${row.usage_cap}`
                                                : String(row.usage ?? 0);
                                        const disc = row.discount_display ?? row.discount_label ?? '—';
                                        return (
                                            <tr
                                                key={row.id ?? row.code}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80 dark:border-neutral-800/80 dark:hover:bg-neutral-900/50"
                                            >
                                                <td className="align-top px-4 py-3 sm:px-5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                            {row.code}
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(row.code)}
                                                                className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                                                                aria-label={ui('copy_code')}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                                                            </button>
                                                        </span>
                                                    </div>
                                                    {row.description ? (
                                                        <p className="mt-1 max-w-xs text-xs text-neutral-500 dark:text-neutral-400">{row.description}</p>
                                                    ) : null}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900 dark:text-white sm:px-5">
                                                    {row.discount_type === 'fixed' ? (
                                                        <>
                                                            <span className="text-neutral-500 dark:text-neutral-400">$</span>{' '}
                                                            {disc.startsWith('$') ? disc.slice(1) : disc}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-neutral-500 dark:text-neutral-400">%</span>{' '}
                                                            {disc.replace(/%$/, '')}
                                                            <span>%</span>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-800 dark:text-neutral-200 sm:px-5">
                                                    {usageLabel}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 sm:px-5">
                                                    <div className="flex flex-col gap-0.5 text-sm leading-snug">
                                                        <span>{formatDateShort(row.valid_from, locale)}</span>
                                                        <span className="text-neutral-500 dark:text-neutral-400">
                                                            to {formatDateShort(row.valid_to, locale)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 sm:px-5">
                                                    <span
                                                        className={[
                                                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                            isActive
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                                : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
                                                        ].join(' ')}
                                                    >
                                                        {isActive ? ui('status_active') : ui('status_inactive')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                                                            aria-label={ui('action_view')}
                                                            onClick={() => setViewingVoucher(row)}
                                                        >
                                                            <Eye className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                                                            aria-label={ui('action_edit')}
                                                            onClick={() => setVoucherModal({ mode: 'edit', voucher: row })}
                                                        >
                                                            <Pencil className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                            aria-label={ui('action_delete')}
                                                            onClick={() => {
                                                                if (!window.confirm(ui('delete_confirm'))) return;
                                                                router.delete(route('client.marketing.vouchers.destroy', row.id), {
                                                                    preserveScroll: true,
                                                                });
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <VoucherFormModal
                    show={voucherModal !== null}
                    mode={voucherModal?.mode ?? 'create'}
                    voucher={voucherModal?.mode === 'edit' ? voucherModal.voucher : null}
                    onClose={() => setVoucherModal(null)}
                />
                <VoucherDetailsModal
                    show={viewingVoucher !== null}
                    voucher={viewingVoucher}
                    onClose={() => setViewingVoucher(null)}
                />
            </div>
        </ClientLayout>
    );
}
