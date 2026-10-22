import 'server-only';

import { NextResponse } from 'next/server';
import { setFlash } from '@/lib/flash';

/**
 * Request/response helpers that give route handlers the same ergonomics the
 * The request helpers the route handlers share: body validation, redirects with
 * `back()->with('error', ...)` and `abort(403)`.
 */

/* ------------------------------------------------------------------ input */

/** Parse a JSON or multipart body into a plain object (with File values kept). */
export async function readBody(request) {
    const type = request.headers.get('content-type') || '';

    if (type.includes('application/json')) {
        return (await request.json().catch(() => ({}))) ?? {};
    }

    if (type.includes('multipart/form-data') || type.includes('application/x-www-form-urlencoded')) {
        const form = await request.formData();
        return formDataToObject(form);
    }

    // Fall back to JSON — the shim always sends one of the two.
    return (await request.json().catch(() => ({}))) ?? {};
}

/** Expands `a[b][0]` bracket keys back into nested objects/arrays. */
export function formDataToObject(form) {
    const out = {};
    for (const [rawKey, value] of form.entries()) {
        const parts = rawKey
            .replace(/\]/g, '')
            .split('[')
            .filter((p) => p !== '');
        let ref = out;
        parts.forEach((part, i) => {
            const last = i === parts.length - 1;
            if (last) {
                if (Array.isArray(ref)) ref.push(value);
                else if (ref[part] !== undefined) {
                    ref[part] = Array.isArray(ref[part]) ? [...ref[part], value] : [ref[part], value];
                } else ref[part] = value;
            } else {
                const nextIsIndex = /^\d+$/.test(parts[i + 1]);
                if (ref[part] === undefined) ref[part] = nextIsIndex ? [] : {};
                ref = ref[part];
            }
        });
    }
    return out;
}

/** Query-string params as a plain object (`$request->query()`). */
export function queryParams(request) {
    const url = new URL(request.url);
    const out = {};
    for (const [k, v] of url.searchParams.entries()) {
        if (out[k] === undefined) out[k] = v;
        else out[k] = Array.isArray(out[k]) ? [...out[k], v] : [out[k], v];
    }
    return out;
}

/** `$request->only([...])` — keeps only non-empty keys, like `filled()`. */
export function only(source, keys) {
    const out = {};
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') out[key] = value;
    }
    return out;
}

/* --------------------------------------------------------------- responses */

/** `redirect()->route(...)->with('success', ...)` */
export function redirectTo(url, flash = {}) {
    return NextResponse.json({ redirect: url, flash });
}

/** `back()->with('success', ...)` — the shim refreshes the current route. */
export function back(flash = {}) {
    return NextResponse.json({ flash });
}

/** Plain success payload for a fetch()-driven UI action. */
export function ok(payload = {}) {
    return NextResponse.json({ ok: true, ...payload });
}

/** 422 with the `{ errors: { field: [msg] } }` shape the forms read. */
export function validationError(errors) {
    return NextResponse.json({ message: 'The given data was invalid.', errors }, { status: 422 });
}

/** `abort($code, $message)` */
export function abort(status, message = null) {
    const defaults = {
        401: 'Unauthenticated.',
        403: 'This action is unauthorized.',
        404: 'Not found.',
        419: 'Page expired.',
        429: 'Too many requests.',
        500: 'Server error.',
    };
    return NextResponse.json({ message: message ?? defaults[status] ?? 'Error' }, { status });
}

/** Full-page redirect that also drops a one-request flash cookie. */
export async function redirectWithFlash(url, flash) {
    if (flash) await setFlash(flash);
    return NextResponse.redirect(url);
}

/* -------------------------------------------------------------- validation */

class ValidationFailed extends Error {
    constructor(errors) {
        super('The given data was invalid.');
        this.name = 'ValidationFailed';
        this.errors = errors;
    }
}

export { ValidationFailed };

/**
 * Compact validator covering the rules this app uses:
 * required, nullable, sometimes, string, numeric, integer, boolean, array,
 * email, url, date, confirmed, in:a,b, not_in, min, max, between, size,
 * regex, same, different, exists (async), unique (async), image/file/mimes.
 *
 * `rules` accepts the array form used by the controllers:
 *   { name: ['required', 'string', 'max:255'], voice_id: ['nullable', 'exists:voices,id'] }
 */
export async function validate(data, rules, { prisma = null, messages = {} } = {}) {
    const errors = {};
    const validated = {};

    for (const [field, ruleList] of Object.entries(rules)) {
        const list = Array.isArray(ruleList) ? ruleList : String(ruleList).split('|');
        const value = getPath(data, field);
        const has = value !== undefined;
        const empty = value === undefined || value === null || value === '';

        const nullable = list.includes('nullable');
        const sometimes = list.includes('sometimes');
        const required = list.includes('required');

        if (sometimes && !has) continue;

        if (required && empty) {
            push(errors, field, messages[`${field}.required`] ?? `The ${label(field)} field is required.`);
            continue;
        }
        if (empty) {
            if (has || nullable) validated[field] = value === '' ? null : (value ?? null);
            continue;
        }

        let failed = false;
        for (const rule of list) {
            if (typeof rule === 'function') {
                const result = await rule(value, data);
                if (result !== true && result) {
                    push(errors, field, typeof result === 'string' ? result : `The ${label(field)} field is invalid.`);
                    failed = true;
                }
                continue;
            }
            const [name, argString] = String(rule).split(':');
            const args = argString ? argString.split(',') : [];
            const message = await checkRule(name, args, value, field, data, prisma);
            if (message) {
                push(errors, field, messages[`${field}.${name}`] ?? message);
                failed = true;
                break;
            }
        }

        if (!failed) validated[field] = cast(list, value);
    }

    if (Object.keys(errors).length) throw new ValidationFailed(errors);
    return validated;
}

async function checkRule(name, args, value, field, data, prisma) {
    const name_ = label(field);

    switch (name) {
        case 'required':
        case 'nullable':
        case 'sometimes':
        case 'file':
            return null;

        case 'string':
            return typeof value === 'string' || value instanceof String
                ? null
                : `The ${name_} must be a string.`;

        case 'numeric':
            return Number.isNaN(Number(value)) ? `The ${name_} must be a number.` : null;

        case 'integer':
            return Number.isInteger(Number(value)) ? null : `The ${name_} must be an integer.`;

        case 'boolean':
            return [true, false, 0, 1, '0', '1', 'true', 'false', 'on', 'off'].includes(value)
                ? null
                : `The ${name_} field must be true or false.`;

        case 'array':
            return Array.isArray(value) ? null : `The ${name_} must be an array.`;

        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
                ? null
                : `The ${name_} must be a valid email address.`;

        case 'url':
            try {
                new URL(String(value));
                return null;
            } catch {
                return `The ${name_} must be a valid URL.`;
            }

        case 'date':
            return Number.isNaN(new Date(value).getTime()) ? `The ${name_} is not a valid date.` : null;

        case 'after': {
            const other = getPath(data, args[0]) ?? args[0];
            return new Date(value) > new Date(other) ? null : `The ${name_} must be after ${args[0]}.`;
        }

        case 'confirmed':
            return getPath(data, `${field}_confirmation`) === value
                ? null
                : `The ${name_} confirmation does not match.`;

        case 'same':
            return getPath(data, args[0]) === value ? null : `The ${name_} and ${args[0]} must match.`;

        case 'different':
            return getPath(data, args[0]) !== value ? null : `The ${name_} and ${args[0]} must be different.`;

        case 'in':
            return args.includes(String(value)) ? null : `The selected ${name_} is invalid.`;

        case 'not_in':
            return args.includes(String(value)) ? `The selected ${name_} is invalid.` : null;

        case 'min':
            return sizeOf(value) >= Number(args[0])
                ? null
                : `The ${name_} must be at least ${args[0]}.`;

        case 'max':
            return sizeOf(value) <= Number(args[0])
                ? null
                : `The ${name_} may not be greater than ${args[0]}.`;

        case 'size':
            return sizeOf(value) === Number(args[0]) ? null : `The ${name_} must be ${args[0]}.`;

        case 'between': {
            const size = sizeOf(value);
            return size >= Number(args[0]) && size <= Number(args[1])
                ? null
                : `The ${name_} must be between ${args[0]} and ${args[1]}.`;
        }

        case 'regex':
            try {
                const body = args.join(',');
                const match = body.match(/^\/(.*)\/([a-z]*)$/);
                const rx = match ? new RegExp(match[1], match[2]) : new RegExp(body);
                return rx.test(String(value)) ? null : `The ${name_} format is invalid.`;
            } catch {
                return null;
            }

        case 'exists': {
            if (!prisma) return null;
            const [table, column = 'id'] = args;
            const model = modelAccessor(prisma, table);
            if (!model) return null;
            const where = { [column]: coerceId(value) };
            const row = await model.findFirst({ where }).catch(() => null);
            return row ? null : `The selected ${name_} is invalid.`;
        }

        case 'unique': {
            if (!prisma) return null;
            const [table, column = field, ignoreId = null, ignoreColumn = 'id'] = args;
            const model = modelAccessor(prisma, table);
            if (!model) return null;
            const where = { [column]: value };
            if (ignoreId && ignoreId !== 'NULL') where[ignoreColumn] = { not: coerceId(ignoreId) };
            const row = await model.findFirst({ where }).catch(() => null);
            return row ? `The ${name_} has already been taken.` : null;
        }

        case 'image':
            return value?.type?.startsWith?.('image/') !== false ? null : `The ${name_} must be an image.`;

        case 'mimes': {
            const name0 = value?.name ?? '';
            const ext = String(name0).split('.').pop()?.toLowerCase();
            return args.includes(ext) ? null : `The ${name_} must be a file of type: ${args.join(', ')}.`;
        }

        default:
            return null;
    }
}

/** `snake_case.field` -> "snake case field" for readable error messages. */
function label(field) {
    return field.replace(/[._]/g, ' ');
}

function push(errors, field, message) {
    (errors[field] ??= []).push(message);
}

function sizeOf(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
        // A numeric string counts as numeric when a numeric rule is present;
        // string length otherwise. Length is the safer default for max:255 on names.
        return value.length;
    }
    if (Array.isArray(value)) return value.length;
    if (value?.size !== undefined) return value.size / 1024; // File size is measured in KB
    return String(value ?? '').length;
}

function cast(rules, value) {
    if (rules.includes('integer')) return parseInt(value, 10);
    if (rules.includes('numeric')) return Number(value);
    if (rules.includes('boolean')) return [true, 1, '1', 'true', 'on'].includes(value);
    return value;
}

function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), obj);
}

function coerceId(value) {
    if (typeof value === 'bigint') return value;
    if (/^\d+$/.test(String(value))) {
        try {
            return BigInt(value);
        } catch {
            return value;
        }
    }
    return value;
}

/** Maps a DB table name to the generated Prisma accessor. */
function modelAccessor(prisma, table) {
    const camel = table
        .replace(/_(\w)/g, (_, c) => c.toUpperCase())
        .replace(/^(\w)/, (_, c) => c.toLowerCase());

    const singular = camel.replace(/ies$/, 'y').replace(/([^s])s$/, '$1');

    return prisma[camel] ?? prisma[singular] ?? null;
}
