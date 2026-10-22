import 'server-only';

import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

/** Port of Admin\PlanController's shaping and validation. */

export function defaultLimits() {
    return {
        products: null, sales: null, purchases: null, customers: null,
        suppliers: null, users: null, branches: null, registers: null,
        warehouses: null, ai_credits: null, sites: null, storage: null,
    };
}

export function planToArray(p) {
    let limits = p.limits;
    if (!limits || typeof limits !== 'object' || Array.isArray(limits)) {
        limits = defaultLimits();
        limits.ai_credits = p.ai_credits;
        limits.sites = p.websites_limit;
    }

    return plain({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        currency_code: p.currency_code,
        monthly_price_cents: p.monthly_price_cents,
        yearly_price_cents: p.yearly_price_cents,
        trial_days: Number(p.trial_days ?? 0),
        stripe_monthly_id: p.stripe_monthly_id,
        stripe_yearly_id: p.stripe_yearly_id,
        features: Array.isArray(p.features) ? p.features : [],
        limits,
        enabled: !!p.enabled,
        featured: !!p.featured,
        popular: !!p.popular,
        sort_order: Number(p.sort_order ?? 0),
        ai_credits: p.ai_credits,
        websites_limit: p.websites_limit,
        export_enabled: !!p.export_enabled,
        custom_domain_enabled: !!p.custom_domain_enabled,
        white_label_enabled: !!p.white_label_enabled,
    });
}

export function planRules() {
    return {
        name: ['required', 'string', 'max:255'],
        slug: ['nullable', 'string', 'max:64'],
        description: ['nullable', 'string', 'max:1000'],
        currency_code: ['required', 'string', 'max:10'],
        monthly_price_cents: ['required', 'integer', 'min:0'],
        yearly_price_cents: ['nullable', 'integer', 'min:0'],
        trial_days: ['nullable', 'integer', 'min:0', 'max:365'],
        stripe_monthly_id: ['nullable', 'string', 'max:255'],
        stripe_yearly_id: ['nullable', 'string', 'max:255'],
        features: ['nullable', 'array'],
        limits: ['nullable', 'array'],
        enabled: ['nullable', 'boolean'],
        featured: ['nullable', 'boolean'],
        popular: ['nullable', 'boolean'],
        sort_order: ['nullable', 'integer', 'min:0'],
        ai_credits: ['nullable', 'integer', 'min:0'],
        websites_limit: ['nullable', 'integer', 'min:0'],
        export_enabled: ['nullable', 'boolean'],
        custom_domain_enabled: ['nullable', 'boolean'],
        white_label_enabled: ['nullable', 'boolean'],
    };
}

export function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
}

export function planAttributes(v) {
    const monthly = Number(v.monthly_price_cents ?? 0);

    return {
        name: v.name,
        slug: v.slug || slugify(v.name),
        description: v.description ?? null,
        currency_code: v.currency_code,
        price_cents: BigInt(monthly),
        interval: 'month',
        monthly_price_cents: BigInt(monthly),
        yearly_price_cents:
            v.yearly_price_cents !== undefined && v.yearly_price_cents !== null
                ? BigInt(Number(v.yearly_price_cents))
                : null,
        trial_days: Number(v.trial_days ?? 0),
        stripe_monthly_id: v.stripe_monthly_id ?? null,
        stripe_yearly_id: v.stripe_yearly_id ?? null,
        features: v.features ?? [],
        limits: v.limits ?? null,
        enabled: v.enabled ?? true,
        featured: v.featured ?? false,
        popular: v.popular ?? false,
        sort_order: Number(v.sort_order ?? 0),
        ai_credits: v.ai_credits !== undefined && v.ai_credits !== null ? Number(v.ai_credits) : null,
        websites_limit:
            v.websites_limit !== undefined && v.websites_limit !== null ? Number(v.websites_limit) : null,
        export_enabled: v.export_enabled ?? false,
        custom_domain_enabled: v.custom_domain_enabled ?? false,
        white_label_enabled: v.white_label_enabled ?? false,
    };
}

export async function nextSortOrder() {
    const agg = await prisma.plan.aggregate({ _max: { sort_order: true } });
    return Number(agg._max.sort_order ?? 0) + 1;
}
