'use client';

import { route } from '@/lib/route';
import { usePage, router } from '@/lib/page-router';

/**
 * Returns active locale, isRtl, locales list, and setLocale(code).
 * setLocale persists (user or session) and reloads so UI and document update.
 */
export function useLocale() {
    const props = usePage().props;
    const locale = props.i18n?.locale ?? props.locale ?? 'en';
    const isRtl = props.i18n?.isRtl ?? false;
    const locales = props.i18n?.locales ?? [];

    const setLocale = (code) => {
        router.put(route('locale.update'), { locale: code }, { preserveScroll: true });
    };

    return { locale, isRtl, locales, setLocale };
}
