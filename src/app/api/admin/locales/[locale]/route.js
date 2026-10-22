import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';
import { clearDictionaryCache } from '@/lib/i18n-server';

/** PUT /admin/locales/{locale} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.locales.update', 'manage_languages');
    if (gate.response) return gate.response;

    // The locales table is keyed by code.
    const { locale: code } = await params;
    const locale = await prisma.locale.findUnique({ where: { code } });
    if (!locale) return abort(404);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:128'],
        native_name: ['nullable', 'string', 'max:128'],
        flag: ['nullable', 'string', 'max:20'],
        enabled: ['nullable', 'boolean'],
        is_rtl: ['nullable', 'boolean'],
        sort_order: ['nullable', 'integer', 'min:0'],
    });

    await prisma.locale.update({
        where: { code },
        data: {
            name: data.name,
            native_name: data.native_name ?? locale.native_name,
            flag: data.flag ?? null,
            enabled: data.enabled ?? locale.enabled,
            is_rtl: data.is_rtl ?? locale.is_rtl,
            sort_order: data.sort_order ?? locale.sort_order,
            updated_at: new Date(),
        },
    });

    clearDictionaryCache();

    return back({ success: 'Locale updated.' });
});

/** DELETE /admin/locales/{locale} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.locales.destroy', 'manage_languages');
    if (gate.response) return gate.response;

    const { locale: code } = await params;
    const locale = await prisma.locale.findUnique({ where: { code } });
    if (!locale) return abort(404);

    if (locale.is_default) {
        return back({ error: 'Cannot delete the default language. Set another as default first.' });
    }

    if ((await prisma.locale.count({ where: { enabled: true } })) <= 1) {
        return back({ error: 'Cannot delete the last enabled language.' });
    }

    await prisma.locale.delete({ where: { code } });
    clearDictionaryCache();

    return back({ success: 'Language removed.' });
});
