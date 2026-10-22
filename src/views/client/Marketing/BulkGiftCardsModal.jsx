'use client';

import { route } from '@/lib/route';
import { useEffect, useMemo } from 'react';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, ThemedSelect } from '@/components/ui';
import { getGiftCardThemeOptions } from './giftCardThemes';

export default function BulkGiftCardsModal({ show, onClose }) {
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.gift_cards_ui.${key}`, opts);

    const initial = useMemo(
        () => ({
            quantity: '5',
            amount: '50.00',
            theme: 'default',
        }),
        [],
    );

    const form = useForm(initial);

    useEffect(() => {
        if (show) {
            form.clearErrors();
            form.reset(initial);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const themeOptions = getGiftCardThemeOptions(ui);

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            quantity: parseInt(d.quantity, 10),
            amount: d.amount,
            theme: d.theme || 'default',
        }));
        form.post(route('client.marketing.gift-cards.bulk-generate'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <Modal.Header title={ui('bulk_title')} subtitle={ui('bulk_subtitle')} onClose={onClose} />
            <form onSubmit={submit}>
                <Modal.Body className="space-y-4">
                    <Input
                        label={ui('bulk_quantity')}
                        value={form.data.quantity}
                        onChange={(e) => form.setData('quantity', e.target.value)}
                        inputMode="numeric"
                        error={form.errors.quantity}
                    />
                    <Input
                        label={ui('bulk_amount_each')}
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                        inputMode="decimal"
                        error={form.errors.amount}
                    />
                    <div>
                        <label htmlFor="bulk-theme" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {ui('field_theme')}
                        </label>
                        <ThemedSelect
                            id="bulk-theme"
                            value={form.data.theme}
                            onChange={(v) => form.setData('theme', v)}
                            options={themeOptions}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={form.processing}
                        className="bg-teal-500 shadow-soft hover:bg-teal-600 focus:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                        {ui('bulk_submit')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
