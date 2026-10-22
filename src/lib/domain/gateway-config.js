import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { decryptString, encryptString } from '@/lib/crypt';
import {
    credsConfigured,
    definitions,
    gatewayFields,
    gatewayLabel,
    isRecurring,
    secretField,
} from '@/lib/services/billing/catalog';

/** Port of App\Http\Controllers\Concerns\InteractsWithPaymentGatewayConfig. */

export const MASK = '••••••••';

/** The `credentials` column holds an encrypted JSON object. */
export function readCredentials(row) {
    if (!row?.credentials) return {};
    try {
        const json = decryptString(row.credentials) ?? row.credentials;
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function activeCredentials(row) {
    const creds = readCredentials(row);
    if (creds.live || creds.test) return (row?.test_mode ? creds.test : creds.live) ?? {};
    return creds;
}

export async function firstOrCreateConfig(gateway) {
    const existing = await prisma.paymentGatewayConfig.findFirst({ where: { gateway } });
    if (existing) return existing;

    return prisma.paymentGatewayConfig.create({
        data: {
            gateway,
            enabled: false,
            test_mode: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

/** paymentGatewayIndexList() */
export async function gatewayIndexList() {
    const keys = Object.keys(definitions());
    const rows = await prisma.paymentGatewayConfig.findMany({ where: { gateway: { in: keys } } });
    const byGateway = Object.fromEntries(rows.map((r) => [r.gateway, r]));

    return keys.map((key) => {
        const row = byGateway[key];
        return {
            gateway: key,
            name: gatewayLabel(key),
            enabled: row?.enabled ?? false,
            test_mode: row?.test_mode ?? true,
            configured: row ? credsConfigured(key, activeCredentials(row)) : false,
            recurring: isRecurring(key),
        };
    });
}

/** paymentGatewayShowPayload() — secrets come back masked, never in the clear. */
export async function gatewayShowPayload(gateway) {
    const row = await firstOrCreateConfig(gateway);
    const fields = gatewayFields(gateway);
    const credentials = readCredentials(row);

    const render = (mode) => {
        const stored = credentials[mode] ?? {};
        const out = {};
        for (const f of fields) {
            const value = String(stored[f.key] ?? '');
            out[f.key] = f.type === 'password' ? (value !== '' ? MASK : '') : value;
        }
        return out;
    };

    return {
        gateway: row.gateway,
        name: gatewayLabel(gateway),
        test_mode: row.test_mode,
        enabled: row.enabled,
        recurring: isRecurring(gateway),
        webhook_url: `${String(config.app.url).replace(/\/+$/, '')}/webhooks/${gateway}`,
        fields,
        test: render('test'),
        live: render('live'),
    };
}

/**
 * persistPaymentGatewayFromRequest() — a blank or masked field keeps the stored
 * value, and enabling requires the secret for the mode being switched on.
 */
export async function persistGateway(gateway, input) {
    const row = await firstOrCreateConfig(gateway);
    const fields = gatewayFields(gateway);

    const existing = readCredentials(row);
    const test = { ...(existing.test ?? {}) };
    const live = { ...(existing.live ?? {}) };

    for (const f of fields) {
        for (const [mode, bag] of [['test', test], ['live', live]]) {
            const value = input[`${mode}_${f.key}`];
            if (value === null || value === undefined || value === '' || /^•+$/u.test(String(value))) {
                continue; // keep stored value
            }
            bag[f.key] = value;
        }
    }

    const enabled = !!input.enabled;
    const testMode = !!input.test_mode;

    if (enabled) {
        const field = secretField(gateway);
        const bag = testMode ? test : live;
        if (field && !bag[field]) {
            return {
                error: {
                    [`${testMode ? 'test' : 'live'}_${field}`]: [
                        'This credential is required before the gateway can be enabled.',
                    ],
                },
            };
        }
    }

    await prisma.paymentGatewayConfig.update({
        where: { id: row.id },
        data: {
            enabled,
            test_mode: testMode,
            credentials: encryptString(JSON.stringify({ test, live })),
            updated_at: new Date(),
        },
    });

    return { ok: true };
}
