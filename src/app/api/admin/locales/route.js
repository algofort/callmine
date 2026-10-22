import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { clearDictionaryCache, readLocaleFile, writeLocaleFile } from '@/lib/i18n-server';

/** POST /admin/locales */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.locales.store', 'manage_languages');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        code: ['required', 'string', 'max:10', 'regex:/^[a-z]{2,6}$/'],
        name: ['required', 'string', 'max:128'],
        native_name: ['nullable', 'string', 'max:128'],
        flag: ['nullable', 'string', 'max:20'],
        enabled: ['nullable', 'boolean'],
        is_rtl: ['nullable', 'boolean'],
        sort_order: ['nullable', 'integer', 'min:0'],
    });

    if (await prisma.locale.findUnique({ where: { code: data.code } })) {
        return validationError({ code: ['The code has already been taken.'] });
    }

    await prisma.locale.create({
        data: {
            code: data.code,
            name: data.name,
            native_name: data.native_name ?? data.name,
            flag: data.flag ?? null,
            enabled: data.enabled ?? true,
            is_rtl: data.is_rtl ?? false,
            sort_order: data.sort_order ?? 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // createLocaleFile(code, copyFromEn: true)
    writeLocaleFile(data.code, readLocaleFile('en'));
    clearDictionaryCache();

    return redirectTo('/admin/locales', { success: 'Locale added.' });
});
