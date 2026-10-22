import AdminLocales from '@/views/Admin/Locales/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { flatDictionary } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

/** GET /admin/locales (locales + translation editor). */
export default async function Page({ searchParams }) {
    await requireAdminPermissions('view_languages');
    const params = await searchParams;

    const locales = await prisma.locale.findMany({
        orderBy: [{ is_default: 'desc' }, { sort_order: 'asc' }, { code: 'asc' }],
    });

    const translationsLocale = String(params?.translations_locale ?? 'en');
    const translationsGroup = String(params?.translations_group ?? '');
    const translationsSearch = String(params?.translations_search ?? '');
    const translationsMissingOnly = ['1', 'true'].includes(String(params?.translations_missing ?? ''));

    const enFlat = await flatDictionary('en');
    const localeFlat = await flatDictionary(translationsLocale);

    let allKeys = Object.keys(enFlat);
    if (!allKeys.length) allKeys = Object.keys(localeFlat);

    const translations = [];
    for (const flatKey of allKeys) {
        const enVal = enFlat[flatKey] ?? '';
        const val = localeFlat[flatKey] ?? '';

        if (translationsGroup !== '' && !flatKey.startsWith(`${translationsGroup}.`)) continue;

        if (translationsSearch !== '') {
            const needle = translationsSearch.toLowerCase();
            const hit =
                flatKey.toLowerCase().includes(needle) ||
                String(val).toLowerCase().includes(needle) ||
                String(enVal).toLowerCase().includes(needle);
            if (!hit) continue;
        }

        if (translationsMissingOnly && String(val).trim() !== '') continue;

        const dot = flatKey.indexOf('.');
        translations.push({
            flat_key: flatKey,
            group: dot === -1 ? 'app' : flatKey.slice(0, dot),
            key: dot === -1 ? flatKey : flatKey.slice(dot + 1),
            value: val,
            en_value: enVal,
        });
    }

    translations.sort((a, b) => a.flat_key.localeCompare(b.flat_key));

    const groups = [
        ...new Set(Object.keys(enFlat).map((k) => (k.includes('.') ? k.split('.')[0] : 'app'))),
    ];

    const defaultLocale = locales.find((l) => l.is_default);

    const props = {
        stats: [
            { label: 'Total languages', value: locales.length, icon: 'globe', accent: 'brand' },
            { label: 'Enabled', value: locales.filter((l) => l.enabled).length, icon: 'check', accent: 'signal' },
            {
                label: 'Default',
                value: defaultLocale?.code ?? '—',
                icon: 'target',
                accent: 'warm',
                hint: defaultLocale?.name ?? null,
            },
        ],
        locales: plain(locales),
        translations,
        translationsLocale,
        translationsGroup,
        translationsSearch,
        translationsMissingOnly,
        groups,
    };

    return renderPage(AdminLocales, 'Admin/Locales/Index', props, {
        url: '/admin/locales',
        isAdminRoute: true,
    });
}
