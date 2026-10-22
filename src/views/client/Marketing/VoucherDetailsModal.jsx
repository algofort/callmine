'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui';

function ordinalDay(n) {
    const j = n % 10;
    const k = n % 100;
    if (k >= 11 && k <= 13) return `${n}th`;
    if (j === 1) return `${n}st`;
    if (j === 2) return `${n}nd`;
    if (j === 3) return `${n}rd`;
    return `${n}th`;
}

/** e.g. January 10th, 2026 */
function formatDateOrdinal(iso, locale) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const month = new Intl.DateTimeFormat(locale || undefined, { month: 'long' }).format(d);
    const year = d.getFullYear();
    return `${month} ${ordinalDay(d.getDate())}, ${year}`;
}

function formatDiscountDisplay(row) {
    const disc = row.discount_display ?? row.discount_label ?? '—';
    if (row.discount_type === 'percentage') {
        const body = String(disc).replace(/%/g, '').trim();
        return `${body}%`;
    }
    const n = String(disc).replace(/^\$/, '').trim();
    if (n === '' || n === '—') return '—';
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
    } catch {
        return `$${n}`;
    }
}

function DetailItem({ label, children, className = '' }) {
    return (
        <div className={className}>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
            <div className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">{children}</div>
        </div>
    );
}

export default function VoucherDetailsModal({ show, onClose, voucher }) {
    const { t, i18n } = useTranslation();
    const ui = (key, opts) => t(`client.vouchers_ui.${key}`, opts);
    const locale = i18n.language?.replace('_', '-') || undefined;

    const [tab, setTab] = useState('details');

    useEffect(() => {
        if (show && voucher) setTab('details');
    }, [show, voucher?.id]);

    const open = Boolean(show && voucher);

    const tabBtn = (id, label) => {
        const active = tab === id;
        return (
            <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                    'rounded-lg px-4 py-2.5 text-sm font-medium transition duration-150',
                    active
                        ? 'border border-neutral-200 bg-white text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'
                        : 'border border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700/80',
                ].join(' ')}
            >
                {label}
            </button>
        );
    };

    let minPurchaseDisplay = '$0.00';
    let isActive = false;
    let perUser = 100;
    let firstTime = false;
    let usageCount = 0;
    if (voucher) {
        isActive = voucher.status === 'active';
        const minPurchase = voucher.min_purchase ?? 0;
        perUser = voucher.per_user_limit ?? 100;
        firstTime = Boolean(voucher.first_time_only);
        usageCount = voucher.usage ?? 0;
        try {
            minPurchaseDisplay = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
                Number(minPurchase),
            );
        } catch {
            minPurchaseDisplay = `$${Number(minPurchase).toFixed(2)}`;
        }
    }

    return (
        <Modal show={open} onClose={onClose} maxWidth="2xl">
            {voucher ? (
                <>
                    <Modal.Header title={ui('view_modal_title')} onClose={onClose} />
                    <div className="border-b border-neutral-200 px-5 pb-4 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-2">
                            {tabBtn('details', ui('tab_voucher_details'))}
                            {tabBtn('usage', ui('tab_usage_history'))}
                        </div>
                    </div>

                    {tab === 'details' ? (
                        <Modal.Body className="pt-5">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-5">
                                <DetailItem label={ui('detail_label_code')}>
                                    <span className="font-mono uppercase tracking-wide">{voucher.code}</span>
                                </DetailItem>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        {ui('detail_label_status')}
                                    </p>
                                    <div className="mt-1">
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
                                    </div>
                                </div>

                                <DetailItem label={ui('detail_label_discount')}>{formatDiscountDisplay(voucher)}</DetailItem>
                                <DetailItem label={ui('detail_label_usage')}>{String(usageCount)}</DetailItem>

                                <DetailItem label={ui('detail_label_valid_from')}>
                                    {formatDateOrdinal(voucher.valid_from, locale)}
                                </DetailItem>
                                <DetailItem label={ui('detail_label_valid_until')}>
                                    {formatDateOrdinal(voucher.valid_to, locale)}
                                </DetailItem>

                                <DetailItem label={ui('detail_label_min_purchase')}>{minPurchaseDisplay}</DetailItem>
                                <DetailItem label={ui('detail_label_per_user')}>{String(perUser)}</DetailItem>

                                <DetailItem label={ui('detail_label_first_time')} className="sm:col-span-2">
                                    {firstTime ? t('common.yes') : t('common.no')}
                                </DetailItem>
                            </div>
                        </Modal.Body>
                    ) : (
                        <Modal.Body className="py-10">
                            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                                {ui('usage_history_empty')}
                            </p>
                        </Modal.Body>
                    )}
                </>
            ) : null}
        </Modal>
    );
}
