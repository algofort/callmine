'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, router, usePage } from '@/lib/page-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Copy,
    CreditCard,
    DollarSign,
    Eye,
    Gift,
    Pencil,
    Plus,
    Search,
    Send,
    TrendingUp,
    UserPlus,
} from 'lucide-react';
import { Badge, Button, Card, Input, TablePagePagination, ThemedSelect } from '@/components/ui';
import PageOverview from '@/components/PageOverview';
import BulkGiftCardsModal from './BulkGiftCardsModal';
import GiftCardDetailsModal from './GiftCardDetailsModal';
import GiftCardFormModal from './GiftCardFormModal';
import { getGiftCardThemeLabel } from './giftCardThemes';

function formatMoney(amount) {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount));
    } catch {
        return `$${Number(amount).toFixed(2)}`;
    }
}

export default function GiftCards({ stats = {}, giftCards: giftCardsProp, filters = {} }) {
    const giftCards = giftCardsProp ?? { data: [], current_page: 1, last_page: 1, total: 0 };
    const { flash } = usePage().props;
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.gift_cards_ui.${key}`, opts);

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [statusSel, setStatusSel] = useState(filters.status ?? '');
    const [formModal, setFormModal] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);

    useEffect(() => {
        setSearchInput(filters.search ?? '');
        setStatusSel(filters.status ?? '');
    }, [filters.search, filters.status]);

    const rows = giftCards?.data ?? [];
    const currentPage = giftCards?.current_page ?? 1;
    const lastPage = giftCards?.last_page ?? 1;

    const loadPage = (page = 1) => {
        router.get(
            route('client.marketing.gift-cards'),
            {
                page,
                search: searchInput.trim() || undefined,
                status: statusSel || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const statusFilterOptions = [
        { value: '', label: ui('filter_all_status') },
        { value: 'active', label: ui('status_active') },
        { value: 'inactive', label: ui('status_inactive') },
    ];

    const copyCode = (code) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(code);
        }
    };

    const s = {
        total_cards: stats.total_cards ?? 0,
        active_cards: stats.active_cards ?? 0,
        total_value: stats.total_value ?? 0,
        redeemed: stats.redeemed ?? 0,
        pending_delivery: stats.pending_delivery ?? 0,
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

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-3xl">{pageTitle}</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('page_subtitle')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="gap-2"
                            onClick={() => setBulkOpen(true)}
                        >
                            <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                            {ui('bulk_generate')}
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            className="gap-2 bg-teal-500 shadow-soft hover:bg-teal-600 focus:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500"
                            onClick={() => setFormModal({ mode: 'create' })}
                        >
                            <Plus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                            {ui('create_gift_card')}
                        </Button>
                    </div>
                </div>

                <PageOverview feature="gift-cards" />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {[
                        {
                            key: 'total',
                            label: ui('stat_total_cards'),
                            value: s.total_cards,
                            Icon: CreditCard,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                        {
                            key: 'active',
                            label: ui('stat_active_cards'),
                            value: s.active_cards,
                            Icon: Gift,
                            valueClass: 'text-emerald-600 dark:text-emerald-400',
                            iconClass: 'text-emerald-500 dark:text-emerald-400',
                        },
                        {
                            key: 'value',
                            label: ui('stat_total_value'),
                            value: formatMoney(s.total_value),
                            Icon: DollarSign,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                        {
                            key: 'redeemed',
                            label: ui('stat_redeemed'),
                            value: formatMoney(s.redeemed),
                            Icon: TrendingUp,
                            valueClass: 'text-neutral-900 dark:text-white',
                        },
                        {
                            key: 'pending',
                            label: ui('stat_pending_delivery'),
                            value: s.pending_delivery,
                            Icon: Send,
                            valueClass: 'text-amber-600 dark:text-amber-400',
                            iconClass: 'text-amber-500 dark:text-amber-400',
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
                                <form
                                    className="relative min-w-0 flex-1 sm:min-w-[12rem]"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        loadPage(1);
                                    }}
                                >
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder={ui('search_placeholder')}
                                        className="pl-10"
                                        aria-label={ui('search_placeholder')}
                                    />
                                </form>
                                <div className="grid min-w-0 grid-cols-1 gap-3 sm:max-w-xs">
                                    <ThemedSelect
                                        value={statusSel}
                                        onChange={(v) => {
                                            setStatusSel(v);
                                            router.get(
                                                route('client.marketing.gift-cards'),
                                                {
                                                    page: 1,
                                                    search: searchInput.trim() || undefined,
                                                    status: v || undefined,
                                                },
                                                { preserveState: true, preserveScroll: true, replace: true },
                                            );
                                        }}
                                        options={statusFilterOptions}
                                        placeholder={ui('filter_all_status')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50/90 dark:border-neutral-800 dark:bg-neutral-900/80">
                                    {['col_code', 'col_amount_balance', 'col_recipient', 'col_theme', 'col_expires', 'col_status', 'col_actions'].map(
                                        (col) => (
                                            <th
                                                key={col}
                                                scope="col"
                                                className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-200 sm:px-5"
                                            >
                                                {ui(col)}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                            {ui('no_results')}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => {
                                        const isActive = row.status === 'active';
                                        return (
                                            <tr
                                                key={row.id}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80 dark:border-neutral-800/80 dark:hover:bg-neutral-900/50"
                                            >
                                                <td className="px-4 py-3 sm:px-5">
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
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-800 dark:text-neutral-200 sm:px-5">
                                                    {formatMoney(row.initial_amount)} / {formatMoney(row.balance)}
                                                </td>
                                                <td className="px-4 py-3 sm:px-5">
                                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                                        {row.recipient_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{row.recipient_email_obfuscated}</div>
                                                </td>
                                                <td className="px-4 py-3 sm:px-5">
                                                    <Badge variant="default" size="sm" className="text-xs font-medium">
                                                        {getGiftCardThemeLabel(row.theme, ui)}
                                                    </Badge>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-neutral-800 dark:text-neutral-200 sm:px-5">
                                                    {row.expires_never ? ui('expires_never_label') : row.expires_label || '—'}
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
                                                            onClick={() => setViewing(row)}
                                                        >
                                                            <Eye className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                                                            aria-label={ui('action_edit')}
                                                            onClick={() => setFormModal({ mode: 'edit', card: row })}
                                                        >
                                                            <Pencil className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                        {row.delivery_status === 'pending' ? (
                                                            <button
                                                                type="button"
                                                                className="rounded-lg p-2 text-teal-600 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/40"
                                                                aria-label={ui('action_send')}
                                                                onClick={() => {
                                                                    router.post(route('client.marketing.gift-cards.send', row.id), {}, { preserveScroll: true });
                                                                }}
                                                            >
                                                                <Send className="h-4 w-4" strokeWidth={2} />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {lastPage > 1 ? (
                        <div className="flex justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-5">
                            <TablePagePagination
                                currentPage={currentPage}
                                lastPage={lastPage}
                                onPageChange={(p) => loadPage(p)}
                            />
                        </div>
                    ) : null}
                </Card>

                <GiftCardFormModal
                    show={formModal !== null}
                    mode={formModal?.mode ?? 'create'}
                    card={formModal?.mode === 'edit' ? formModal.card : null}
                    onClose={() => setFormModal(null)}
                />
                <GiftCardDetailsModal show={viewing !== null} card={viewing} onClose={() => setViewing(null)} />
                <BulkGiftCardsModal show={bulkOpen} onClose={() => setBulkOpen(false)} />
            </div>
        </ClientLayout>
    );
}
