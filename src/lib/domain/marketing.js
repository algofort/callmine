import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { ValidationFailed } from '@/lib/http';

/** Port of Client\MarketingController's constants, formatters and helpers. */

export const VOUCHER_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
export const VOUCHER_TYPE = { FIXED: 'fixed', PERCENTAGE: 'percentage' };

export const GIFT_CARD_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
export const GIFT_DELIVERY = { PENDING: 'pending', SENT: 'sent' };
export const GIFT_THEMES = ['default', 'birthday', 'holiday', 'travel', 'thankyou', 'celebration'];

export const REFERRAL_STATUS = {
    PENDING: 'pending',
    SUCCESSFUL: 'successful',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};
export const REWARD_TYPE = { PERCENTAGE: 'percentage', FIXED: 'fixed' };

const money = (n) =>
    Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

export function obfuscateEmail(email) {
    if (!email) return 'N/A';

    const parts = String(email).split('@');
    if (parts.length !== 2) return '***';

    const [local, domain] = parts;
    const localOb =
        local.length <= 2
            ? `${local.slice(0, 1)}***`
            : local.slice(0, 2) + '*'.repeat(Math.max(2, local.length - 2));
    const domainOb = domain.slice(0, 2) + '*'.repeat(Math.max(1, domain.length - 2));

    return `${localOb}@${domainOb}`;
}

/* ------------------------------------------------------------- vouchers */

export function voucherRules() {
    return {
        code: ['required', 'string', 'max:64'],
        status: ['required', 'string', `in:${VOUCHER_STATUS.ACTIVE},${VOUCHER_STATUS.INACTIVE}`],
        discount_type: ['required', 'string', `in:${VOUCHER_TYPE.FIXED},${VOUCHER_TYPE.PERCENTAGE}`],
        discount_value: ['required', 'numeric'],
        description: ['nullable', 'string', 'max:5000'],
        min_purchase: ['nullable', 'numeric', 'min:0'],
        max_discount_cap: ['nullable', 'numeric', 'min:0'],
        total_usage_limit: ['nullable', 'integer', 'min:1'],
        per_user_limit: ['nullable', 'integer', 'min:1'],
        valid_from: ['required', 'date'],
        valid_until: ['required', 'date', 'after:valid_from'],
        first_time_only: ['nullable', 'boolean'],
        stackable: ['nullable', 'boolean'],
    };
}

/**
 * The post-validation checks the controller ran by hand, plus the
 * unique-per-client code rule.
 */
export async function normalizeVoucher(validated, clientId, ignoreId = null) {
    const value = Number(validated.discount_value);

    if (validated.discount_type === VOUCHER_TYPE.PERCENTAGE) {
        if (value <= 0 || value > 100) {
            throw new ValidationFailed({ discount_value: ['Percentage must be between 0 and 100.'] });
        }
    } else if (value <= 0) {
        throw new ValidationFailed({ discount_value: ['Fixed amount must be greater than zero.'] });
    }

    const code = String(validated.code).toUpperCase();
    const clash = await prisma.marketingVoucher.findFirst({
        where: {
            client_id: BigInt(clientId),
            code,
            ...(ignoreId ? { id: { not: BigInt(ignoreId) } } : {}),
        },
    });
    if (clash) throw new ValidationFailed({ code: ['The code has already been taken.'] });

    const optionalNumber = (v, fallback = null) =>
        v === undefined || v === null || v === '' ? fallback : Number(v);

    return {
        code,
        status: validated.status,
        discount_type: validated.discount_type,
        discount_value: value,
        description: validated.description || null,
        min_purchase: optionalNumber(validated.min_purchase, 0),
        max_discount_cap: optionalNumber(validated.max_discount_cap),
        total_usage_limit: optionalNumber(validated.total_usage_limit),
        per_user_limit: optionalNumber(validated.per_user_limit, 100),
        valid_from: new Date(validated.valid_from),
        valid_until: new Date(validated.valid_until),
        first_time_only: !!validated.first_time_only,
        stackable: !!validated.stackable,
    };
}

export function voucherToArray(v) {
    const dv = Number(v.discount_value);
    const isPercentage = v.discount_type === VOUCHER_TYPE.PERCENTAGE;

    return {
        id: String(v.id),
        code: v.code,
        description: v.description,
        discount_type: v.discount_type,
        discount_label: isPercentage ? `${money(dv)}%` : money(dv),
        discount_display: isPercentage ? `${money(dv)}%` : `$${money(dv)}`,
        usage: Number(v.usage_count ?? 0),
        usage_cap: v.total_usage_limit,
        valid_from: v.valid_from ? new Date(v.valid_from).toISOString().slice(0, 10) : null,
        valid_to: v.valid_until ? new Date(v.valid_until).toISOString().slice(0, 10) : null,
        status: v.status,
        min_purchase: Number(v.min_purchase ?? 0),
        max_discount_cap: v.max_discount_cap !== null ? Number(v.max_discount_cap) : null,
        per_user_limit: Number(v.per_user_limit ?? 0),
        first_time_only: !!v.first_time_only,
        stackable: !!v.stackable,
    };
}

/* ----------------------------------------------------------- gift cards */

export function giftCardRules(isCreate = true) {
    return {
        recipient_name: ['nullable', 'string', 'max:255'],
        recipient_email: ['nullable', 'email', 'max:255'],
        personal_message: ['nullable', 'string', 'max:5000'],
        theme: ['required', 'string', `in:${GIFT_THEMES.join(',')}`],
        expires_at: ['nullable', 'date'],
        status: ['required', 'string', `in:${GIFT_CARD_STATUS.ACTIVE},${GIFT_CARD_STATUS.INACTIVE}`],
        ...(isCreate ? { initial_amount: ['required', 'numeric', 'min:0.01'] } : {}),
    };
}

export function normalizeGiftCard(validated, isCreate = true) {
    let expiresAt = null;
    if (validated.expires_at) {
        // Carbon::parse(...)->endOfDay()
        expiresAt = new Date(validated.expires_at);
        expiresAt.setHours(23, 59, 59, 999);
    }

    return {
        initial_amount: isCreate ? Number(validated.initial_amount) : 0,
        recipient_name: validated.recipient_name || null,
        recipient_email: validated.recipient_email || null,
        personal_message: validated.personal_message || null,
        theme: validated.theme,
        expires_at: expiresAt,
        status: validated.status,
    };
}

export async function generateGiftCode(clientId) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (;;) {
        const segments = [];
        for (let s = 0; s < 4; s++) {
            const bytes = crypto.randomBytes(4);
            let seg = '';
            for (let i = 0; i < 4; i++) seg += alphabet[bytes[i] % alphabet.length];
            segments.push(seg);
        }
        const code = `GIFT-${segments.join('-')}`;

        const exists = await prisma.marketingGiftCard.findFirst({
            where: { client_id: BigInt(clientId), code },
        });
        if (!exists) return code;
    }
}

export function giftCardToArray(g) {
    const expiresNever = g.expires_at === null;

    return {
        id: String(g.id),
        code: g.code,
        initial_amount: Number(g.initial_amount),
        balance: Number(g.balance),
        recipient_name: g.recipient_name,
        recipient_email: g.recipient_email,
        recipient_email_obfuscated: obfuscateEmail(g.recipient_email),
        personal_message: g.personal_message,
        theme: g.theme,
        expires_at: g.expires_at ? new Date(g.expires_at).toISOString() : null,
        expires_never: expiresNever,
        expires_label: expiresNever
            ? null
            : new Date(g.expires_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              }),
        created_at: g.created_at ? new Date(g.created_at).toISOString() : null,
        created_label: g.created_at
            ? new Date(g.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
              })
            : null,
        status: g.status,
        delivery_status: g.delivery_status,
    };
}

/* ------------------------------------------------------------ referrals */

export const REFERRAL_SETTING_DEFAULTS = {
    enabled: true,
    reward_type: REWARD_TYPE.PERCENTAGE,
    reward_value: 10,
    referred_user_discount: 10,
    min_order_amount: 0,
    expiry_days: 90,
    terms: null,
};

export async function firstOrCreateReferralSettings(clientId) {
    const client_id = BigInt(clientId);
    const existing = await prisma.marketingReferralSetting.findUnique({ where: { client_id } });
    if (existing) return existing;

    return prisma.marketingReferralSetting.create({
        data: {
            client_id,
            ...REFERRAL_SETTING_DEFAULTS,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

export function referralSettingsToArray(s) {
    return {
        enabled: s.enabled,
        reward_type: s.reward_type,
        reward_value: Number(s.reward_value),
        referred_user_discount: Number(s.referred_user_discount),
        min_order_amount: Number(s.min_order_amount),
        expiry_days: Number(s.expiry_days),
        terms: s.terms,
    };
}

export function referralToArray(r) {
    return {
        id: String(r.id),
        referral_code: r.referral_code,
        referrer_obfuscated: obfuscateEmail(r.referrer_email),
        referred_obfuscated: obfuscateEmail(r.referred_email),
        status: r.status,
        reward_amount: Number(r.reward_amount ?? 0),
        created_label: r.created_at
            ? new Date(r.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : null,
    };
}

/** The `where` a referral list/export shares. */
export function referralWhere(clientId, params) {
    const where = { client_id: BigInt(clientId) };

    if (params?.search) {
        const s = String(params.search);
        where.OR = [
            { referral_code: { contains: s } },
            { referrer_email: { contains: s } },
            { referred_email: { contains: s } },
        ];
    }
    if (params?.status) where.status = String(params.status);

    return where;
}
