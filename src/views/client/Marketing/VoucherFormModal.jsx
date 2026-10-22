'use client';

import { route } from '@/lib/route';
import { useEffect, useMemo } from 'react';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { Button, Input, Modal, ThemedSelect, Toggle } from '@/components/ui';

const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

function generateVoucherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i += 1) {
        s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
}

function defaultForm() {
    return {
        code: generateVoucherCode(),
        status: 'active',
        discount_type: 'fixed',
        discount_value: '1.00',
        description: '',
        min_purchase: '0.00',
        max_discount_cap: '',
        total_usage_limit: '',
        per_user_limit: '100',
        valid_from: '2026-01-10T01:26',
        valid_until: '2026-02-26T01:26',
        first_time_only: false,
        stackable: false,
    };
}

/** Map API / table row to form state (edit mode). */
function voucherToForm(v) {
    const discountType = v.discount_type === 'percentage' ? 'percentage' : 'fixed';
    let discountValue = '0';
    if (discountType === 'percentage') {
        const s = v.discount_label ?? v.discount_display ?? '0';
        discountValue = String(s).replace(/%/g, '').trim();
    } else {
        const s = v.discount_label ?? v.discount_display ?? '0';
        discountValue = String(s).replace(/^\$/, '').trim();
    }

    const dateToLocal = (iso) => {
        if (!iso) return '';
        const d = String(iso).slice(0, 10);
        return d ? `${d}T01:26` : '';
    };

    const cap = v.usage_cap ?? v.total_usage_limit;

    return {
        code: (v.code ?? '').toUpperCase(),
        status: v.status === 'inactive' ? 'inactive' : 'active',
        discount_type: discountType,
        discount_value: discountValue,
        description: v.description ?? '',
        min_purchase: v.min_purchase != null && v.min_purchase !== '' ? String(v.min_purchase) : '0.00',
        max_discount_cap:
            v.max_discount_cap != null && v.max_discount_cap !== '' ? String(v.max_discount_cap) : '',
        total_usage_limit: cap != null && cap !== '' ? String(cap) : '',
        per_user_limit:
            v.per_user_limit != null && v.per_user_limit !== '' ? String(v.per_user_limit) : '100',
        valid_from: dateToLocal(v.valid_from),
        valid_until: dateToLocal(v.valid_to ?? v.valid_until),
        first_time_only: Boolean(v.first_time_only),
        stackable: Boolean(v.stackable),
    };
}

const textareaClass =
    'w-full min-h-[96px] resize-y rounded-soft border border-soft border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-inner transition duration-150 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500';

/**
 * Create or edit voucher — same layout; edit hides “Generate code” and uses Edit copy.
 */
export default function VoucherFormModal({ show, onClose, mode = 'create', voucher = null }) {
    const { t } = useTranslation();
    const ui = (key, opts) => t(`client.vouchers_ui.${key}`, opts);
    const isEdit = mode === 'edit';
    const idPrefix = isEdit ? 'edit-voucher' : 'create-voucher';

    const initialCreate = useMemo(() => defaultForm(), []);
    const form = useForm(initialCreate);

    useEffect(() => {
        form.transform((data) => ({
            ...data,
            description: data.description === '' ? null : data.description,
            max_discount_cap: data.max_discount_cap === '' ? null : data.max_discount_cap,
            total_usage_limit: data.total_usage_limit === '' ? null : data.total_usage_limit,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time transform for submit payload
    }, []);

    useEffect(() => {
        if (!show) return;
        form.clearErrors();
        if (isEdit && voucher) {
            form.reset(voucherToForm(voucher));
        } else {
            form.reset(defaultForm());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens / row changes
    }, [show, isEdit, voucher?.id]);

    const statusOptions = [
        { value: 'active', label: ui('status_active') },
        { value: 'inactive', label: ui('status_inactive') },
    ];

    const discountTypeOptions = [
        { value: 'fixed', label: ui('type_fixed_amount') },
        { value: 'percentage', label: ui('type_percentage') },
    ];

    const setField = (key, value) => {
        form.setData(key, value);
    };

    const handleGenerateCode = () => {
        setField('code', generateVoucherCode());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };
        if (isEdit && voucher) {
            form.put(route('client.marketing.vouchers.update', voucher.id), opts);
        } else {
            form.post(route('client.marketing.vouchers.store'), opts);
        }
    };

    const title = isEdit ? ui('edit_modal_title') : ui('modal_title');
    const subtitle = isEdit ? ui('edit_modal_subtitle') : ui('modal_subtitle');
    const submitLabel = isEdit ? ui('edit_modal_submit') : ui('modal_submit');

    const err = (name) => form.errors[name];

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <Modal.Header title={title} subtitle={subtitle} onClose={onClose} />
            <form onSubmit={handleSubmit}>
                <Modal.Body className="max-h-[min(70vh,720px)] space-y-4 overflow-y-auto sm:space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="min-w-0 sm:col-span-1">
                            <label htmlFor={`${idPrefix}-code`} className={labelClass}>
                                {ui('field_voucher_code')}
                            </label>
                            <div
                                className={
                                    isEdit
                                        ? 'flex'
                                        : 'flex flex-col gap-2 sm:flex-row sm:items-stretch'
                                }
                            >
                                <Input
                                    id={`${idPrefix}-code`}
                                    value={form.data.code}
                                    onChange={(e) => setField('code', e.target.value.toUpperCase())}
                                    className={[
                                        'min-w-0 font-mono text-sm uppercase',
                                        !isEdit ? 'flex-1' : '',
                                    ].join(' ')}
                                    autoComplete="off"
                                    error={err('code')}
                                />
                                {!isEdit ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="md"
                                        className="shrink-0 whitespace-nowrap border-neutral-900 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-100 dark:hover:bg-neutral-800"
                                        onClick={handleGenerateCode}
                                    >
                                        {ui('generate_code')}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <div>
                            <label htmlFor={`${idPrefix}-status`} className={labelClass}>
                                {ui('field_status')}
                            </label>
                            <ThemedSelect
                                id={`${idPrefix}-status`}
                                value={form.data.status}
                                onChange={(v) => setField('status', v)}
                                options={statusOptions}
                                placeholder={ui('field_status')}
                            />
                            {err('status') ? (
                                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{err('status')}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor={`${idPrefix}-discount-type`} className={labelClass}>
                                {ui('field_discount_type')}
                            </label>
                            <ThemedSelect
                                id={`${idPrefix}-discount-type`}
                                value={form.data.discount_type}
                                onChange={(v) => setField('discount_type', v)}
                                options={discountTypeOptions}
                                placeholder={ui('field_discount_type')}
                            />
                            {err('discount_type') ? (
                                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{err('discount_type')}</p>
                            ) : null}
                        </div>
                        <Input
                            label={ui('field_discount_value')}
                            value={form.data.discount_value}
                            onChange={(e) => setField('discount_value', e.target.value)}
                            inputMode="decimal"
                            autoComplete="off"
                            error={err('discount_value')}
                        />
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
                            {ui('field_description')}
                        </label>
                        <textarea
                            id={`${idPrefix}-description`}
                            value={form.data.description ?? ''}
                            onChange={(e) => setField('description', e.target.value)}
                            placeholder={ui('placeholder_description')}
                            className={textareaClass}
                            rows={3}
                        />
                        {err('description') ? (
                            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{err('description')}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label={ui('field_min_purchase')}
                            value={form.data.min_purchase}
                            onChange={(e) => setField('min_purchase', e.target.value)}
                            inputMode="decimal"
                            autoComplete="off"
                            error={err('min_purchase')}
                        />
                        <Input
                            label={ui('field_max_discount_cap')}
                            value={form.data.max_discount_cap ?? ''}
                            onChange={(e) => setField('max_discount_cap', e.target.value)}
                            placeholder={ui('placeholder_no_cap')}
                            inputMode="decimal"
                            autoComplete="off"
                            error={err('max_discount_cap')}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label={ui('field_total_usage_limit')}
                            value={form.data.total_usage_limit ?? ''}
                            onChange={(e) => setField('total_usage_limit', e.target.value)}
                            placeholder={ui('placeholder_unlimited')}
                            inputMode="numeric"
                            autoComplete="off"
                            error={err('total_usage_limit')}
                        />
                        <Input
                            label={ui('field_per_user_limit')}
                            value={form.data.per_user_limit}
                            onChange={(e) => setField('per_user_limit', e.target.value)}
                            inputMode="numeric"
                            autoComplete="off"
                            error={err('per_user_limit')}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor={`${idPrefix}-valid-from`} className={labelClass}>
                                {ui('field_valid_from')}
                            </label>
                            <div className="relative">
                                <Input
                                    id={`${idPrefix}-valid-from`}
                                    type="datetime-local"
                                    value={form.data.valid_from}
                                    onChange={(e) => setField('valid_from', e.target.value)}
                                    className="pr-10"
                                    error={err('valid_from')}
                                />
                                <Calendar
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                                    strokeWidth={2}
                                    aria-hidden
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor={`${idPrefix}-valid-until`} className={labelClass}>
                                {ui('field_valid_until')}
                            </label>
                            <div className="relative">
                                <Input
                                    id={`${idPrefix}-valid-until`}
                                    type="datetime-local"
                                    value={form.data.valid_until}
                                    onChange={(e) => setField('valid_until', e.target.value)}
                                    className="pr-10"
                                    error={err('valid_until')}
                                />
                                <Calendar
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                                    strokeWidth={2}
                                    aria-hidden
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:flex-row sm:flex-wrap sm:gap-8">
                        <Toggle
                            checked={form.data.first_time_only}
                            onChange={(v) => setField('first_time_only', v)}
                            label={ui('toggle_first_time')}
                            activeVariant="teal"
                        />
                        <Toggle
                            checked={form.data.stackable}
                            onChange={(v) => setField('stackable', v)}
                            label={ui('toggle_stackable')}
                            activeVariant="teal"
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
                        {submitLabel}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
