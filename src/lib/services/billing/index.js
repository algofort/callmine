import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { decryptString } from '@/lib/crypt';
import { credsConfigured, definitions, getDefinition } from './catalog';
import { createStripeGateway } from './stripe';
import { createPayPalGateway, createPaddleGateway } from './paypal-paddle';
import {
    createCashfreeGateway,
    createMyFatoorahGateway,
    createPaymobGateway,
    createPaystackGateway,
    createRazorpayGateway,
    createTapGateway,
    createXenditGateway,
} from './http-gateways';

/**
 * Port of App\Services\Billing\BillingGatewayRegistry: DB-configured gateways
 * first (payment_gateway_configs), then the .env-configured Stripe/PayPal/Paddle
 * fallbacks — the DB always wins.
 */

const FACTORIES = {
    stripe: (creds, testMode, s, c) => createStripeGateway(creds, testMode, s, c),
    paypal: (creds, testMode, s, c) =>
        createPayPalGateway(
            String(creds.client_id ?? ''),
            String(creds.client_secret ?? ''),
            testMode,
            s,
            c,
            String(creds.webhook_id ?? ''),
        ),
    paddle: (creds, testMode, s, c) =>
        createPaddleGateway(
            String(creds.api_key ?? ''),
            testMode ? 'sandbox' : 'production',
            s,
            c,
            String(creds.webhook_secret ?? ''),
        ),
    razorpay: createRazorpayGateway,
    paystack: createPaystackGateway,
    cashfree: createCashfreeGateway,
    xendit: createXenditGateway,
    myfatoorah: createMyFatoorahGateway,
    tap: createTapGateway,
    paymob: createPaymobGateway,
};

function appUrl() {
    return String(config.app.url).replace(/\/+$/, '');
}

function webhookUrl(gateway) {
    return `${appUrl()}/webhooks/${gateway}`;
}

/** — the live or test credential set. */
function activeCredentials(row) {
    let creds = {};
    try {
        const raw = row.credentials;
        if (raw) {
            const json = decryptString(raw) ?? raw;
            creds = typeof json === 'string' ? JSON.parse(json) : json;
        }
    } catch {
        creds = {};
    }

    if (!creds || typeof creds !== 'object') return {};

    // Stored as { live: {...}, test: {...} } or flat.
    if (creds.live || creds.test) {
        return (row.test_mode ? creds.test : creds.live) ?? {};
    }
    return creds;
}

/**
 * Builds the registry for this request. Each call re-reads the DB so an admin
 * credential change takes effect immediately.
 */
export async function billingRegistry() {
    const gateways = {};
    const successUrl = `${appUrl()}/app/billing?checkout=success`;
    const cancelUrl = `${appUrl()}/app/pricing?checkout=canceled`;

    // 1. Admin-managed configs.
    let rows = [];
    try {
        rows = await prisma.paymentGatewayConfig.findMany({ where: { enabled: true } });
    } catch {
        rows = [];
    }

    for (const row of rows) {
        const def = getDefinition(row.gateway);
        if (!def || gateways[row.gateway]) continue;

        const creds = activeCredentials(row);
        if (!credsConfigured(row.gateway, creds)) continue;

        const factory = FACTORIES[row.gateway];
        if (!factory) continue;

        try {
            gateways[row.gateway] = factory(
                creds,
                !!row.test_mode,
                successUrl,
                cancelUrl,
                webhookUrl(row.gateway),
            );
        } catch (e) {
            console.warn('Failed to build billing gateway from DB config', {
                gateway: row.gateway,
                error: e?.message,
            });
        }
    }

    // 2. .env fallbacks for the three original gateways.
    const cfg = config.billing.gateways;

    if (!gateways.stripe && cfg.stripe.enabled && cfg.stripe.secret_key) {
        gateways.stripe = createStripeGateway(
            { secret_key: cfg.stripe.secret_key, webhook_secret: cfg.stripe.webhook_secret },
            false,
            cfg.stripe.success_url || successUrl,
            cfg.stripe.cancel_url || cancelUrl,
        );
    }

    if (!gateways.paypal && cfg.paypal.enabled && cfg.paypal.client_id) {
        gateways.paypal = createPayPalGateway(
            cfg.paypal.client_id,
            cfg.paypal.client_secret ?? '',
            !!cfg.paypal.sandbox,
            cfg.paypal.success_url || successUrl,
            cfg.paypal.cancel_url || cancelUrl,
            cfg.paypal.webhook_id ?? '',
        );
    }

    if (!gateways.paddle && cfg.paddle.enabled && cfg.paddle.api_key) {
        gateways.paddle = createPaddleGateway(
            cfg.paddle.api_key,
            cfg.paddle.environment ?? 'sandbox',
            cfg.paddle.success_url || successUrl,
            cfg.paddle.cancel_url || cancelUrl,
            cfg.paddle.webhook_secret ?? '',
        );
    }

    return {
        all: () => gateways,
        get: (k) => gateways[k] ?? null,
        configured: () => Object.fromEntries(Object.entries(gateways).filter(([, g]) => g.isConfigured())),

        listForFrontend() {
            return Object.entries(definitions()).map(([k, def]) => {
                const g = gateways[k];
                return {
                    key: k,
                    name: g ? g.name() : def.label,
                    configured: g ? g.isConfigured() : false,
                    recurring: !!def.recurring,
                };
            });
        },
    };
}

export { definitions, getDefinition } from './catalog';
