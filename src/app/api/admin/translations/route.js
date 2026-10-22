import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { clearDictionaryCache, flatDictionary, unflatten, writeLocaleFile } from '@/lib/i18n-server';

/** PUT /admin/translations */
export const PUT = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.translations.update', 'manage_languages');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        locale: ['required', 'string', 'max:10'],
        flat_key: ['required', 'string', 'max:255'],
        value: ['nullable', 'string'],
    });

    // Edits are written back into the locale file, which is the source of truth.
    const flat = { ...(await flatDictionary(data.locale)) };
    flat[data.flat_key] = data.value ?? '';

    writeLocaleFile(data.locale, unflatten(flat));
    clearDictionaryCache();

    return back({ success: 'Translation saved.' });
});
