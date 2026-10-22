import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';

/** Port of Client\WidgetController. */

export const WIDGET_POSITIONS = ['bottom-right', 'bottom-left'];

/** Str::random(32) */
export function randomToken(length = 32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

/** WebsiteWidget::firstOrCreate(['client_id' => …], ['public_token' => …]) */
export async function firstOrCreateWidget(clientId) {
    const client_id = BigInt(clientId);
    const existing = await prisma.websiteWidget.findUnique({ where: { client_id } });
    if (existing) return existing;

    return prisma.websiteWidget.create({
        data: {
            client_id,
            public_token: randomToken(32),
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}
