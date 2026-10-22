import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { clearDictionaryCache, flatDictionary, unflatten, writeLocaleFile } from '@/lib/i18n-server';

/** POST /admin/translations/bulk */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.translations.bulk', 'manage_languages');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        locale: ['required', 'string', 'max:10'],
        translations: ['required', 'array'],
    });

    const flat = { ...(await flatDictionary(data.locale)) };
    for (const row of data.translations ?? []) {
        if (!row?.flat_key) continue;
        flat[row.flat_key] = row.value ?? '';
    }

    writeLocaleFile(data.locale, unflatten(flat));
    clearDictionaryCache();

    return back({ success: `${(data.translations ?? []).length} translations saved.` });
});
