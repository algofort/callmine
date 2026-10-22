import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate, validationError } from '@/lib/http';
import { clearDictionaryCache, flatDictionary, unflatten, writeLocaleFile } from '@/lib/i18n-server';
import { defaultAiProvider } from '@/lib/services/ai';

/** How many strings to translate per LLM call. */
const BATCH = 40;

/** POST /admin/translations/auto-translate — ::autoTranslateMissing() */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.translations.auto-translate', 'manage_languages');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        locale: ['required', 'string'],
    });

    const target = await prisma.locale.findUnique({ where: { code: data.locale } });
    if (!target) return validationError({ locale: ['The selected locale is invalid.'] });

    if (data.locale === 'en') {
        return back({ success: 'English is the source; no auto-translate needed.' });
    }

    const provider = await defaultAiProvider();
    if (!provider) {
        return back({
            error: 'No translation provider configured. Set OPENAI_API_KEY or add a key under Admin → Engines → OpenAI.',
        });
    }

    const enFlat = await flatDictionary('en');
    const targetFlat = { ...(await flatDictionary(data.locale)) };

    const missing = Object.keys(enFlat).filter(
        (k) => String(targetFlat[k] ?? '').trim() === '' && String(enFlat[k] ?? '').trim() !== '',
    );
    if (!missing.length) return back({ success: 'Nothing to translate — all keys are filled.' });

    let updated = 0;

    for (let i = 0; i < missing.length; i += BATCH) {
        const chunk = missing.slice(i, i + BATCH);
        const source = Object.fromEntries(chunk.map((k) => [k, enFlat[k]]));

        const prompt =
            `Translate the VALUES of this JSON object from English into ${target.name} (${target.code}). ` +
            'Keep every key exactly as given. Preserve placeholders like {{name}} and :count verbatim. ' +
            `Respond with ONLY the translated JSON object.\n\n${JSON.stringify(source)}`;

        try {
            const res = await provider.complete(prompt, { max_tokens: 2000, temperature: 0 });
            const match = String(res.text ?? '').match(/\{[\s\S]*\}/);
            if (!match) continue;

            const translated = JSON.parse(match[0]);
            for (const [key, value] of Object.entries(translated)) {
                if (typeof value === 'string' && value.trim() !== '' && chunk.includes(key)) {
                    targetFlat[key] = value;
                    updated++;
                }
            }
        } catch (e) {
            console.warn('[auto-translate] batch failed:', e?.message);
        }
    }

    if (updated > 0) {
        writeLocaleFile(data.locale, unflatten(targetFlat));
        clearDictionaryCache();
    }

    return back({ success: `${updated} of ${missing.length} missing translations filled.` });
});
