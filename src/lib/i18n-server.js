import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import prisma from '@/lib/prisma';
import config from '@/lib/config';

/**
 * Server half of I18nFileService: locale JSON lives in src/locales/{code}.json
 * in the nested shape the client expects.
 */

const LOCALE_DIR = path.join(process.cwd(), 'src', 'locales');
const cache = new Map();

export function localeFilePath(code) {
    const safe = String(code).replace(/[^a-z0-9_-]/gi, '');
    return path.join(LOCALE_DIR, `${safe}.json`);
}

export function readLocaleFile(code) {
    const file = localeFilePath(code);
    if (!fs.existsSync(file)) return {};
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return {};
    }
}

export function writeLocaleFile(code, nested) {
    fs.mkdirSync(LOCALE_DIR, { recursive: true });
    fs.writeFileSync(localeFilePath(code), JSON.stringify(nested, null, 4));
    cache.delete(code);
}

export function flatten(nested, prefix = '') {
    const out = {};
    for (const [k, v] of Object.entries(nested ?? {})) {
        const key = prefix === '' ? k : `${prefix}.${k}`;
        if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
        else out[key] = v;
    }
    return out;
}

export function unflatten(flat) {
    const out = {};
    for (const [key, value] of Object.entries(flat ?? {})) {
        const parts = key.split('.');
        let ref = out;
        parts.forEach((part, i) => {
            if (i === parts.length - 1) ref[part] = value;
            else {
                if (typeof ref[part] !== 'object' || ref[part] === null) ref[part] = {};
                ref = ref[part];
            }
        });
    }
    return out;
}

/**
 * — the locale JSON file, flattened.
 *
 * The `translations` table is deliberately NOT read here: the admin translation
 * editor writes edits back into the locale file (putFlatDictionary), so the file
 * is the single source of truth at render time.
 */
export async function flatDictionary(code) {
    if (cache.has(code)) return cache.get(code);

    const flat = flatten(readLocaleFile(code));
    cache.set(code, flat);
    return flat;
}

export function clearDictionaryCache(code) {
    if (code) cache.delete(code);
    else cache.clear();
}

/** Nested translations for the `i18n.translations` shared prop. */
export async function translationsFor(code) {
    return unflatten(await flatDictionary(code));
}

export async function localesForSwitcher() {
    try {
        const rows = await prisma.locale.findMany({
            where: { enabled: true },
            orderBy: [{ is_default: 'desc' }, { sort_order: 'asc' }, { code: 'asc' }],
        });
        if (rows.length) {
            return rows.map((l) => ({
                code: l.code,
                name: l.name,
                native_name: l.native_name ?? l.name,
                is_rtl: !!l.is_rtl,
                flag: l.flag ?? null,
            }));
        }
    } catch {
        /* fall through to the bundled default */
    }

    return [{ code: 'en', name: 'English', native_name: 'English', is_rtl: false, flag: null }];
}

export function isRtl(code) {
    return config.locales.rtl.includes(code);
}

/** `__()` / `trans()` for server-side strings (flash messages, mails). */
export async function t(key, locale = config.app.locale, replacements = {}) {
    const dict = await flatDictionary(locale);
    let value = dict[key] ?? key;
    for (const [k, v] of Object.entries(replacements)) {
        value = value.replaceAll(`:${k}`, String(v));
    }
    return value;
}
