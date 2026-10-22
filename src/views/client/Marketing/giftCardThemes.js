'use client';

/** Stored values for `marketing_gift_cards.theme` — keep in sync with `MarketingGiftCard::THEMES`. */
export const GIFT_CARD_THEME_VALUES = ['default', 'birthday', 'holiday', 'travel', 'thankyou', 'celebration'];

/**
 * @param {(key: string) => string} ui - `client.gift_cards_ui` translator
 */
export function getGiftCardThemeOptions(ui) {
    return GIFT_CARD_THEME_VALUES.map((value) => ({
        value,
        label: ui(`theme_${value}`),
    }));
}

/**
 * @param {(key: string) => string} ui - `client.gift_cards_ui` translator
 */
export function getGiftCardThemeLabel(theme, ui) {
    if (theme && GIFT_CARD_THEME_VALUES.includes(theme)) {
        return ui(`theme_${theme}`);
    }
    return theme || '—';
}
