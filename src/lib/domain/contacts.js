import 'server-only';

import { parse } from 'csv-parse/sync';
import prisma from '@/lib/prisma';
import { canCreate, limitFor } from '@/lib/plans';

/** Port of App\Support\Phone, App\Models\Contact constants and ContactImporter. */

export const SOURCE = { MANUAL: 'manual', CSV: 'csv', API: 'api' };

/** Pipeline stages in order: key => label. */
export const STAGES = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    won: 'Won',
    lost: 'Lost',
};

/**
 * Best-effort normalization to E.164. Returns null when the input clearly isn't a
 * phone number; a 10-digit national number is assumed US (+1).
 */
export function toE164(raw, defaultCountryCode = '1') {
    if (raw === null || raw === undefined) return null;

    const trimmed = String(raw).trim();
    if (trimmed === '') return null;

    let hasPlus = trimmed.startsWith('+');
    let digits = trimmed.replace(/\D+/g, '');
    if (digits === '') return null;

    if (!hasPlus && digits.startsWith('00')) {
        digits = digits.slice(2);
        hasPlus = true;
    }
    if (!hasPlus && digits.length === 10) digits = defaultCountryCode + digits;
    if (digits.length < 8 || digits.length > 15) return null;

    return `+${digits}`;
}

export function maskPhone(phone) {
    if (!phone) return '—';
    const len = phone.length;
    if (len <= 5) return phone;
    return phone.slice(0, 3) + '•'.repeat(Math.max(0, len - 5)) + phone.slice(-2);
}

/** — first header matching any alias. */
function col(header, aliases) {
    for (const alias of aliases) {
        const i = header.indexOf(alias);
        if (i !== -1) return i;
    }
    return null;
}

/**
 * — normalizes phones, dedupes on (client_id, phone)
 * and enforces the plan contact limit on new inserts.
 */
export async function importCsv(clientId, buffer) {
    let rows;
    try {
        rows = parse(buffer, { relax_column_count: true, skip_empty_lines: true, bom: true });
    } catch {
        return { inserted: 0, merged: 0, skipped: 0, limited: 0 };
    }
    if (!rows.length) return { inserted: 0, merged: 0, skipped: 0, limited: 0 };

    const header = rows.shift().map((h) => String(h ?? '').toLowerCase().trim());
    const idx = {
        name: col(header, ['name', 'full name', 'contact', 'first name']),
        phone: col(header, ['phone', 'phone number', 'number', 'mobile', 'cell']),
        email: col(header, ['email', 'e-mail', 'email address']),
        company: col(header, ['company', 'organization', 'organisation', 'business']),
    };

    if (idx.phone === null) {
        return { inserted: 0, merged: 0, skipped: rows.length, limited: 0 };
    }

    const client_id = BigInt(clientId);
    const limit = await limitFor(clientId, 'contacts');
    let currentCount = await prisma.contact.count({ where: { client_id } });

    let inserted = 0;
    let merged = 0;
    let skipped = 0;
    let limited = 0;

    for (const row of rows) {
        const phone = toE164(row[idx.phone]);
        if (!phone) {
            skipped++;
            continue;
        }

        const attrs = {};
        for (const field of ['name', 'email', 'company']) {
            if (idx[field] === null) continue;
            const value = String(row[idx[field]] ?? '').trim();
            if (value !== '') attrs[field] = value;
        }

        const existing = await prisma.contact.findFirst({ where: { client_id, phone } });
        if (existing) {
            if (Object.keys(attrs).length) {
                await prisma.contact.update({
                    where: { id: existing.id },
                    data: { ...attrs, updated_at: new Date() },
                });
            }
            merged++;
            continue;
        }

        if (limit !== null && currentCount >= limit) {
            limited++;
            continue;
        }

        await prisma.contact.create({
            data: {
                ...attrs,
                client_id,
                phone,
                source: SOURCE.CSV,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        inserted++;
        currentCount++;
    }

    return { inserted, merged, skipped, limited };
}

export { canCreate };
