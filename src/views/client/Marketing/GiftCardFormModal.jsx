'use client';

import { route } from '@/lib/route';
import { useEffect, useMemo } from 'react';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { Button, Input, Modal, ThemedSelect, Toggle } from '@/components/ui';
import { getGiftCardThemeOptions } from './giftCardThemes';

const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

const AMOUNT_PRESETS = [10, 25, 50, 100, 200];

function defaultExpiryYmd() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
}

function defaultCreate() {
    return {
        initial_amount: '200',
        recipient_name: '',
        recipient_email: '',
        personal_message: '',
        theme: 'default',
        expires_at: defaultExpiryYmd(),
        expires_never: true,
        expires_at_edit: '',
    };
}

function expiresDateFromRow(row) {
    if (row.expires_never || !row.expires_at) {
        return '';
    }
    return String(row.expires_at).slice(0, 10);
}

function rowToForm(row) {
    return {
        initial_amount: String(row.initial_amount ?? '0'),
        recipient_name: row.recipient_name ?? '',
        recipient_email: row.recipient_email ?? '',
        personal_message: row.personal_message ?? '',
        theme: row.theme ?? 'default',
        expires_never: row.expires_never ?? !row.expires_at,
        expires_at_edit: expiresDateFromRow(row),
        status: row.status === 'inactive' ? 'inactive' : 'active',
    };
}

function presetMatchesAmount(amountStr) {
    const n = parseFloat(String(amountStr).replace(/,/g, ''));
    if (Number.isNaN(n)) {
        return null;
    }
    const rounded = Math.round(n * 100) / 100;
    return AMOUNT_PRESETS.includes(rounded) ? rounded : null;
}

export default function GiftCardFormModal({ show, onClose, mode = 'create', card = null }) {
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.gift_cards_ui.${key}`, opts);
    const isEdit = mode === 'edit';
    const idPrefix = isEdit ? 'edit-gc' : 'create-gc';

    const blank = useMemo(() => defaultCreate(), []);
    const form = useForm(blank);

    useEffect(() => {
        if (!show) return;
        form.clearErrors();
        if (isEdit && card) {
            form.reset(rowToForm(card));
        } else {
            form.reset(defaultCreate());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, isEdit, card?.id]);

    const themeOptions = getGiftCardThemeOptions(ui);

    const statusOptions = [
        { value: 'active', label: ui('status_active') },
        { value: 'inactive', label: ui('status_inactive') },
    ];

    const buildPayload = (data) => {
        const base = {
            recipient_name: data.recipient_name === '' ? null : data.recipient_name,
            recipient_email: data.recipient_email === '' ? null : data.recipient_email,
            personal_message: data.personal_message === '' ? null : data.personal_message,
            theme: data.theme,
        };
        if (isEdit) {
            return {
                ...base,
                expires_at: data.expires_never ? null : data.expires_at_edit || null,
                status: data.status,
            };
        }
        return {
            ...base,
            initial_amount: data.initial_amount,
            expires_at: data.expires_at || null,
            status: 'active',
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => onClose() };
        form.transform(() => buildPayload(form.data));
        if (isEdit && card) {
            form.put(route('client.marketing.gift-cards.update', card.id), opts);
        } else {
            form.post(route('client.marketing.gift-cards.store'), opts);
        }
    };

    const title = isEdit ? ui('modal_edit_title') : ui('modal_create_title');
    const subtitle = isEdit ? ui('modal_edit_subtitle') : ui('modal_create_subtitle');

    const err = (k) => form.errors[k];

    const activePreset = !isEdit ? presetMatchesAmount(form.data.initial_amount) : null;

    const presetBtnClass = (preset) =>
        [
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150',
            activePreset === preset
                ? 'border-teal-500 bg-teal-500 text-white shadow-sm dark:bg-teal-600'
                : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-500',
        ].join(' ');

    const textareaClass = [
        'min-h-[100px] w-full rounded-soft border border-soft border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-inner transition duration-150 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500',
        err('personal_message') && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <Modal.Header title={title} subtitle={subtitle} onClose={onClose} />
            <form onSubmit={handleSubmit}>
                <Modal.Body className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto">
                    {!isEdit ? (
                        <>
                            <div>
                                <p className={labelClass}>{ui('field_amount_presets')}</p>
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {AMOUNT_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            className={presetBtnClass(preset)}
                                            onClick={() => form.setData('initial_amount', String(preset))}
                                        >
                                            ${preset}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    value={form.data.initial_amount}
                                    onChange={(e) => form.setData('initial_amount', e.target.value)}
                                    inputMode="decimal"
                                    error={err('initial_amount')}
                                />
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-theme`} className={labelClass}>
                                    {ui('field_theme')}
                                </label>
                                <ThemedSelect
                                    id={`${idPrefix}-theme`}
                                    value={form.data.theme}
                                    onChange={(v) => form.setData('theme', v)}
                                    options={themeOptions}
                                    placeholder={ui('field_theme')}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label={ui('field_recipient_name_optional')}
                                    placeholder={ui('placeholder_recipient_name')}
                                    value={form.data.recipient_name}
                                    onChange={(e) => form.setData('recipient_name', e.target.value)}
                                    autoComplete="name"
                                    error={err('recipient_name')}
                                />
                                <Input
                                    label={ui('field_recipient_email_optional')}
                                    type="email"
                                    placeholder={ui('placeholder_recipient_email')}
                                    value={form.data.recipient_email}
                                    onChange={(e) => form.setData('recipient_email', e.target.value)}
                                    autoComplete="email"
                                    error={err('recipient_email')}
                                />
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-msg`} className={labelClass}>
                                    {ui('field_personal_message')}
                                </label>
                                <textarea
                                    id={`${idPrefix}-msg`}
                                    className={textareaClass}
                                    placeholder={ui('placeholder_personal_message')}
                                    value={form.data.personal_message}
                                    onChange={(e) => form.setData('personal_message', e.target.value)}
                                    rows={4}
                                />
                                {err('personal_message') ? (
                                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
                                        {err('personal_message')}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-exp-create`} className={labelClass}>
                                    {ui('field_expires_on')}
                                </label>
                                <div className="relative">
                                    <Input
                                        id={`${idPrefix}-exp-create`}
                                        type="date"
                                        value={form.data.expires_at}
                                        onChange={(e) => form.setData('expires_at', e.target.value)}
                                        className="pr-10"
                                        error={err('expires_at')}
                                    />
                                    <Calendar
                                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Input
                                label={ui('field_amount')}
                                value={form.data.initial_amount}
                                disabled
                                className="opacity-80"
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label={ui('field_recipient_name')}
                                    value={form.data.recipient_name}
                                    onChange={(e) => form.setData('recipient_name', e.target.value)}
                                    error={err('recipient_name')}
                                />
                                <Input
                                    label={ui('field_recipient_email')}
                                    type="email"
                                    value={form.data.recipient_email}
                                    onChange={(e) => form.setData('recipient_email', e.target.value)}
                                    error={err('recipient_email')}
                                />
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-theme-edit`} className={labelClass}>
                                    {ui('field_theme')}
                                </label>
                                <ThemedSelect
                                    id={`${idPrefix}-theme-edit`}
                                    value={form.data.theme}
                                    onChange={(v) => form.setData('theme', v)}
                                    options={themeOptions}
                                    placeholder={ui('field_theme')}
                                />
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-msg-edit`} className={labelClass}>
                                    {ui('field_personal_message')}
                                </label>
                                <textarea
                                    id={`${idPrefix}-msg-edit`}
                                    className={textareaClass}
                                    placeholder={ui('placeholder_personal_message')}
                                    value={form.data.personal_message}
                                    onChange={(e) => form.setData('personal_message', e.target.value)}
                                    rows={4}
                                />
                                {err('personal_message') ? (
                                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
                                        {err('personal_message')}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Toggle
                                    checked={form.data.expires_never}
                                    onChange={(v) => form.setData('expires_never', v)}
                                    label={ui('expires_never')}
                                    activeVariant="teal"
                                />
                                {!form.data.expires_never ? (
                                    <div>
                                        <label htmlFor={`${idPrefix}-exp-edit`} className={labelClass}>
                                            {ui('field_expires_on')}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id={`${idPrefix}-exp-edit`}
                                                type="date"
                                                value={form.data.expires_at_edit}
                                                onChange={(e) => form.setData('expires_at_edit', e.target.value)}
                                                className="pr-10"
                                                error={err('expires_at')}
                                            />
                                            <Calendar
                                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                                                strokeWidth={2}
                                                aria-hidden
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <label htmlFor={`${idPrefix}-status`} className={labelClass}>
                                    {ui('field_status')}
                                </label>
                                <ThemedSelect
                                    id={`${idPrefix}-status`}
                                    value={form.data.status}
                                    onChange={(v) => form.setData('status', v)}
                                    options={statusOptions}
                                    placeholder={ui('field_status')}
                                />
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={form.processing}
                        className="bg-teal-500 shadow-soft hover:bg-teal-600 focus:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                        {isEdit ? ui('modal_save') : ui('modal_create_submit')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
