'use client';

import { usePage } from '@/lib/page-router';

/**
 * Shared display-currency money formatter. Mirrors the server-side
 * App\Services\CurrencyService so client-rendered amounts match the backend.
 *
 * exchange_rate = units of the DEFAULT currency (USD) per 1 unit of a currency.
 * To convert: value_in_default = amount * from.rate; amount_out = value_in_default / to.rate.
 *
 * Usage:
 *   const money = useMoney();
 *   money(cents)              // convert from USD (default) to the user's display currency
 *   money(cents, 'EUR')       // convert from a specific source currency
 *   money(cents, 'EUR', { convert: false })  // format as-is, no conversion
 */
export function useMoney() {
    const page = usePage();
    const currencies = page.props.currencies ?? [];
    const displayCode = page.props.displayCurrency ?? 'USD';

    const byCode = (code) => currencies.find((c) => c.code === code);
    const defaultCode = currencies.find((c) => Number(c.exchange_rate) === 1)?.code ?? 'USD';

    return (cents, sourceCode = defaultCode, opts = {}) => {
        const amount = Number(cents || 0);
        const convert = opts.convert !== false;
        const targetCode = convert ? displayCode : sourceCode;

        const from = byCode(sourceCode);
        const to = byCode(targetCode);

        // Fallback: no rate data — render source amount with a plain symbol.
        if (!to) {
            const dec = from?.decimals ?? 2;
            return `${from?.symbol ?? '$'}${(amount / 10 ** dec).toLocaleString(undefined, {
                minimumFractionDigits: dec,
                maximumFractionDigits: dec,
            })}`;
        }

        let major = amount / 10 ** (from?.decimals ?? 2);
        if (convert && from && to && sourceCode !== targetCode) {
            const inDefault = major * Number(from.exchange_rate);
            major = inDefault / Number(to.exchange_rate);
        }

        const dec = opts.decimals ?? to.decimals;
        return `${to.symbol}${major.toLocaleString(undefined, {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec,
        })}`;
    };
}
