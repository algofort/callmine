import AdminGeneralSettings from '@/views/Admin/GeneralSettings/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { assetUrl, generalSettings } from '@/lib/settings';
import { COUNTRIES } from '@/lib/countries';

export const dynamic = 'force-dynamic';

/** Keep a saved-but-unlisted value selectable rather than silently dropping it. */
function ensureOption(items, value, label = null) {
    const v = String(value ?? '').trim();
    if (v === '') return items;
    if (items.some((i) => i.value === v)) return items;
    return [{ value: v, label: label ?? v }, ...items];
}

/** GET /admin/general-settings */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const row = await generalSettings();

    let timezones = Intl.supportedValuesOf('timeZone')
        .sort()
        .map((id) => ({ value: id, label: id }));

    const tzSaved = String(row?.timezone || 'UTC');
    timezones = ensureOption(
        timezones,
        tzSaved,
        timezones.some((t) => t.value === tzSaved) ? null : `${tzSaved} (invalid)`,
    );

    let countries = Object.entries(COUNTRIES)
        .map(([code, name]) => ({ value: code, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const countrySaved = String(row?.country || 'BD').toUpperCase();
    countries = ensureOption(
        countries,
        countrySaved,
        COUNTRIES[countrySaved] ? null : `${countrySaved} (add to src/lib/countries.js)`,
    );

    const localeRows = await prisma.locale.findMany({
        orderBy: [{ is_default: 'desc' }, { sort_order: 'asc' }, { code: 'asc' }],
    });
    let locales = localeRows.map((l) => ({ value: l.code, label: l.native_name || l.name }));
    if (!locales.length) locales = [{ value: 'en', label: 'English' }];

    const localeSaved = String(row?.default_locale || locales[0].value);
    locales = ensureOption(locales, localeSaved);

    const currencyRows = await prisma.currency.findMany({
        orderBy: { code: 'asc' },
        select: { code: true },
    });
    let currencies = currencyRows.map((c) => ({ value: c.code, label: c.code }));
    if (!currencies.length) {
        currencies = [
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
            { value: 'BDT', label: 'BDT' },
        ];
    }

    const currencySaved = String(row?.default_currency || 'USD').toUpperCase();
    currencies = ensureOption(currencies, currencySaved);

    const props = {
        settings: {
            system_title: row?.system_title ?? '',
            company_name: row?.company_name ?? '',
            tagline: row?.tagline ?? '',
            email: row?.email ?? '',
            timezone: tzSaved,
            default_locale: localeSaved,
            country: countrySaved,
            default_currency: currencySaved,
            primary_color: row?.primary_color ?? '#0284c7',
            favicon_url: row?.favicon_path ? assetUrl(row.favicon_path) : null,
            site_logo_url: row?.site_logo_path ? assetUrl(row.site_logo_path) : null,
            updated_at: row?.updated_at ? Math.floor(new Date(row.updated_at).getTime() / 1000) : null,
        },
        timezones,
        countries,
        locales,
        currencies,
    };

    return renderPage(AdminGeneralSettings, 'Admin/GeneralSettings/Index', props, {
        url: '/admin/general-settings',
        isAdminRoute: true,
    });
}
