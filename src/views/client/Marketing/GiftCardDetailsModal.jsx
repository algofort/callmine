'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Modal } from '@/components/ui';
import { getGiftCardThemeLabel } from './giftCardThemes';

function formatMoney(amount) {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount));
    } catch {
        return `$${Number(amount).toFixed(2)}`;
    }
}

function Detail({ label, children, className = '' }) {
    return (
        <div className={className}>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
            <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{children}</div>
        </div>
    );
}

export default function GiftCardDetailsModal({ show, onClose, card }) {
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.gift_cards_ui.${key}`, opts);
    const [tab, setTab] = useState('details');

    useEffect(() => {
        if (show && card?.id) {
            setTab('details');
        }
    }, [show, card?.id]);

    const open = Boolean(show && card);

    return (
        <Modal show={open} onClose={onClose} maxWidth="lg">
            {card ? (
                <>
                    <Modal.Header title={ui('details_title')} onClose={onClose} />
                    <Modal.Body className="space-y-4">
                        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100/90 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/80">
                            <button
                                type="button"
                                onClick={() => setTab('details')}
                                className={[
                                    'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150',
                                    tab === 'details'
                                        ? 'border border-neutral-200 bg-white text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                                ].join(' ')}
                            >
                                {ui('tab_details')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('transactions')}
                                className={[
                                    'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150',
                                    tab === 'transactions'
                                        ? 'border border-neutral-200 bg-white text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                                ].join(' ')}
                            >
                                {ui('tab_transactions')}
                            </button>
                        </div>

                        {tab === 'details' ? (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Detail label={ui('col_code')}>
                                        <span className="font-mono text-xs font-normal">{card.code}</span>
                                    </Detail>
                                    <Detail label={ui('field_status')}>
                                        <Badge variant={card.status === 'active' ? 'success' : 'default'} size="sm">
                                            {card.status === 'active' ? ui('status_active') : ui('status_inactive')}
                                        </Badge>
                                    </Detail>
                                    <Detail label={ui('col_original_amount')}>
                                        {formatMoney(card.initial_amount)}
                                    </Detail>
                                    <Detail label={ui('col_current_balance')}>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatMoney(card.balance)}
                                        </span>
                                    </Detail>
                                    <Detail label={ui('col_recipient')}>
                                        <span className="font-semibold">{card.recipient_name || '—'}</span>
                                        <p className="mt-0.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
                                            {card.recipient_email_obfuscated}
                                        </p>
                                    </Detail>
                                    <Detail label={ui('col_theme')}>
                                        <Badge variant="default" size="sm">
                                            {getGiftCardThemeLabel(card.theme, ui)}
                                        </Badge>
                                    </Detail>
                                    <Detail label={ui('col_created')}>
                                        {card.created_label || '—'}
                                    </Detail>
                                    <Detail label={ui('col_expires')}>
                                        {card.expires_never ? ui('expires_never_label') : card.expires_label || '—'}
                                    </Detail>
                                    <Detail label={ui('col_delivery_status')} className="sm:col-span-2">
                                        {card.delivery_status === 'sent' ? ui('delivery_sent') : ui('delivery_pending')}
                                    </Detail>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        {ui('details_personal_message')}
                                    </p>
                                    <div className="mt-2 rounded-soft border border-neutral-200 bg-neutral-100 px-3 py-3 text-sm italic text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200">
                                        {card.personal_message ? (
                                            <span className="whitespace-pre-wrap">&ldquo;{card.personal_message}&rdquo;</span>
                                        ) : (
                                            <span className="text-neutral-400 not-italic dark:text-neutral-500">—</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                {ui('transactions_empty')}
                            </p>
                        )}
                    </Modal.Body>
                </>
            ) : null}
        </Modal>
    );
}
