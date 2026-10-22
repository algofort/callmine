'use client';

import { usePage } from '@/lib/page-router';
import { useEffect, useLayoutEffect } from 'react';
import i18n, { applyLocaleToDocument } from '@/i18n';

/**
 * Syncs shared page props (locale, rtlLocales) to document dir/lang and i18n.
 * Merges `props.i18n.translations` on every visit so new keys (e.g. client.custom_orders_ui.*)
 * work after client-side navigation and stay aligned with the locale files.
 */
export default function LocaleSync() {
    const page = usePage();
    const { locale, rtlLocales = [] } = page.props;
    const i18nShared = page.props.i18n;

    useEffect(() => {
        if (locale) {
            applyLocaleToDocument(locale, rtlLocales);
        }
    }, [locale, rtlLocales]);

    useLayoutEffect(() => {
        const lng = i18nShared?.locale;
        const bundle = i18nShared?.translations;
        if (!lng || !bundle || typeof i18n.addResourceBundle !== 'function') {
            return;
        }
        i18n.addResourceBundle(lng, 'translation', bundle, true, true);
        if (i18n.language !== lng) {
            i18n.changeLanguage(lng);
        }
    }, [i18nShared?.locale, i18nShared?.translations]);

    return null;
}
