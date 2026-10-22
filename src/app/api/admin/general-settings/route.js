import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { generalSettings } from '@/lib/settings';
import { deleteFile, storeFile } from '@/lib/storage';
import { COUNTRIES } from '@/lib/countries';

/** POST /admin/general-settings */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.general-settings.update', 'manage_settings');
    if (gate.response) return gate.response;

    const row = await generalSettings();
    const body = await readBody(request);

    // The saved value stays valid even if it is no longer in the catalog.
    const countryCodes = new Set(Object.keys(COUNTRIES));
    if (row?.country) countryCodes.add(String(row.country).toUpperCase());

    const localeRows = await prisma.locale.findMany({ select: { code: true } });
    const localeCodes = new Set(localeRows.map((l) => l.code));
    if (!localeCodes.size) localeCodes.add('en');
    if (row?.default_locale) localeCodes.add(row.default_locale);

    const currencyRows = await prisma.currency.findMany({ select: { code: true } });
    const currencyCodes = new Set(currencyRows.map((c) => c.code));
    if (!currencyCodes.size) ['USD', 'EUR', 'BDT'].forEach((c) => currencyCodes.add(c));
    if (row?.default_currency) currencyCodes.add(String(row.default_currency).toUpperCase());

    const data = await validate(body, {
        system_title: ['required', 'string', 'max:191'],
        company_name: ['required', 'string', 'max:191'],
        tagline: ['nullable', 'string', 'max:500'],
        email: ['required', 'email', 'max:191'],
        timezone: ['required', 'string', 'max:128'],
        default_locale: ['required', 'string', 'max:32', `in:${[...localeCodes].join(',')}`],
        country: ['required', 'string', 'size:2', `in:${[...countryCodes].join(',')}`],
        default_currency: ['required', 'string', 'max:8', `in:${[...currencyCodes].join(',')}`],
        primary_color: [
            'required', 'string', 'max:32',
            'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/',
        ],
    });

    // timezone:all
    try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
    } catch {
        return validationError({ timezone: ['The timezone is not valid.'] });
    }

    const patch = {};

    if (body.favicon instanceof File && body.favicon.size > 0) {
        if (body.favicon.size > 1024 * 1024) {
            return validationError({ favicon: ['The favicon may not be greater than 1024 kilobytes.'] });
        }
        if (row?.favicon_path) await deleteFile(row.favicon_path, 'public');
        patch.favicon_path = await storeFile(body.favicon, 'general-settings', 'public');
    }

    if (body.site_logo instanceof File && body.site_logo.size > 0) {
        if (body.site_logo.size > 4096 * 1024) {
            return validationError({ site_logo: ['The site logo may not be greater than 4096 kilobytes.'] });
        }
        if (row?.site_logo_path) await deleteFile(row.site_logo_path, 'public');
        patch.site_logo_path = await storeFile(body.site_logo, 'general-settings', 'public');
    }

    await prisma.generalSetting.update({
        where: { id: row.id },
        data: {
            system_title: data.system_title,
            company_name: data.company_name,
            tagline: data.tagline ?? null,
            email: data.email,
            timezone: data.timezone,
            default_locale: data.default_locale,
            country: String(data.country).toUpperCase(),
            default_currency: String(data.default_currency).toUpperCase(),
            primary_color: data.primary_color,
            ...patch,
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/general-settings', { success: 'General settings saved.' });
});
