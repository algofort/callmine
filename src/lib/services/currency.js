import 'server-only';

import prisma from '@/lib/prisma';

/** Port of App\Services\CurrencyService. */

async function currency(code) {
    if (!code) return null;
    return prisma.currency.findFirst({ where: { code, enabled: true } }).catch(() => null);
}

export async function format(amountCents, currencyCode) {
    const c = await currency(currencyCode);
    if (!c) return String(amountCents);

    const value = Number(amountCents) / 10 ** c.decimals;
    return (
        c.symbol +
        value.toLocaleString('en-US', {
            minimumFractionDigits: c.decimals,
            maximumFractionDigits: c.decimals,
        })
    );
}

/**
 * exchange_rate is units of the DEFAULT currency per 1 unit of a currency, so a
 * conversion goes source -> default -> target.
 */
export async function convert(amountCents, fromCode, toCode) {
    if (fromCode === toCode) return amountCents;

    const [from, to] = await Promise.all([currency(fromCode), currency(toCode)]);
    if (!from || !to) return amountCents;

    const majorFrom = Number(amountCents) / 10 ** from.decimals;
    const inDefault = majorFrom * Number(from.exchange_rate);
    const majorTo = inDefault / Number(to.exchange_rate);

    return Math.round(majorTo * 10 ** to.decimals);
}

export async function formatConverted(amountCents, fromCode, toCode) {
    return format(await convert(amountCents, fromCode, toCode), toCode);
}

export async function defaultCurrencyCode() {
    const row = await prisma.currency
        .findFirst({ where: { is_default: true, enabled: true } })
        .catch(() => null);
    return row?.code ?? null;
}
