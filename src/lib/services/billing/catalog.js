/** Port of App\Services\Billing\GatewayCatalog. */

export function definitions() {
    return {
        stripe: {
            label: 'Stripe',
            recurring: true,
            secret_field: 'secret_key',
            fields: [
                { key: 'publishable_key', label: 'Publishable Key', type: 'text', required: false, help: 'pk_live_… / pk_test_…' },
                { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'sk_live_… / sk_test_…' },
                { key: 'webhook_secret', label: 'Webhook Signing Secret', type: 'password', required: false, help: 'whsec_… (from the webhook endpoint you add below)' },
            ],
        },
        paypal: {
            label: 'PayPal',
            recurring: true,
            secret_field: 'client_secret',
            fields: [
                { key: 'client_id', label: 'Client ID', type: 'text', required: true, help: 'From your PayPal REST app' },
                { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
                { key: 'webhook_id', label: 'Webhook ID', type: 'text', required: false, help: 'Required for signature verification in production' },
            ],
        },
        paddle: {
            label: 'Paddle',
            recurring: true,
            secret_field: 'api_key',
            fields: [
                { key: 'api_key', label: 'API Key', type: 'password', required: true, help: 'Paddle Billing API key' },
                { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false, help: 'From the notification destination' },
            ],
        },
        razorpay: {
            label: 'Razorpay',
            recurring: true,
            secret_field: 'key_secret',
            fields: [
                { key: 'key_id', label: 'Key ID', type: 'text', required: true, help: 'rzp_live_… / rzp_test_…' },
                { key: 'key_secret', label: 'Key Secret', type: 'password', required: true },
                { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false, help: 'Set the same secret on the Razorpay webhook' },
            ],
        },
        paystack: {
            label: 'Paystack',
            recurring: true,
            secret_field: 'secret_key',
            fields: [
                { key: 'public_key', label: 'Public Key', type: 'text', required: false, help: 'pk_live_… / pk_test_…' },
                { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'sk_live_… / sk_test_… (also used to verify webhooks)' },
            ],
        },
        cashfree: {
            label: 'Cashfree',
            recurring: true,
            secret_field: 'secret_key',
            fields: [
                { key: 'app_id', label: 'App ID', type: 'text', required: true, help: 'x-client-id' },
                { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'x-client-secret' },
                { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false, help: 'Defaults to Secret Key if empty' },
            ],
        },
        xendit: {
            label: 'Xendit',
            recurring: true,
            secret_field: 'secret_key',
            fields: [
                { key: 'secret_key', label: 'Secret API Key', type: 'password', required: true, help: 'xnd_… (used as Basic auth username)' },
                { key: 'callback_token', label: 'Webhook Verification Token', type: 'password', required: false, help: 'x-callback-token from Xendit dashboard' },
                { key: 'public_key', label: 'Public Key', type: 'text', required: false },
            ],
        },
        myfatoorah: {
            label: 'MyFatoorah',
            recurring: true,
            secret_field: 'api_token',
            fields: [
                { key: 'api_token', label: 'API Token', type: 'password', required: true, help: 'Bearer token from MyFatoorah portal' },
                { key: 'base_url', label: 'API Base URL', type: 'text', required: false, help: 'e.g. https://apitest.myfatoorah.com (test) or your country live URL' },
                { key: 'webhook_secret', label: 'Webhook Secret Key', type: 'password', required: false, help: 'From MyFatoorah portal → Webhook settings' },
            ],
        },
        tap: {
            label: 'Tap',
            recurring: false,
            secret_field: 'secret_key',
            fields: [
                { key: 'publishable_key', label: 'Publishable Key', type: 'text', required: false, help: 'pk_live_… / pk_test_…' },
                { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'sk_live_… / sk_test_…' },
                { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false, help: 'For webhook hashstring verification' },
            ],
        },
        paymob: {
            label: 'Paymob',
            recurring: false,
            secret_field: 'api_key',
            fields: [
                { key: 'api_key', label: 'API Key', type: 'password', required: true, help: 'From Paymob dashboard → Settings → Account Info' },
                { key: 'integration_id', label: 'Card Integration ID', type: 'text', required: true, help: 'Online card payment integration ID' },
                { key: 'iframe_id', label: 'iFrame ID', type: 'text', required: true },
                { key: 'hmac_secret', label: 'HMAC Secret', type: 'password', required: false, help: 'For callback verification' },
            ],
        },
    };
}

export function getDefinition(gateway) {
    return definitions()[gateway] ?? null;
}

export function gatewayExists(gateway) {
    return !!definitions()[gateway];
}

export function gatewayLabel(gateway) {
    return definitions()[gateway]?.label ?? gateway.charAt(0).toUpperCase() + gateway.slice(1);
}

export function isRecurring(gateway) {
    return !!definitions()[gateway]?.recurring;
}

export function gatewayFields(gateway) {
    return definitions()[gateway]?.fields ?? [];
}

export function gatewayFieldKeys(gateway) {
    return gatewayFields(gateway).map((f) => f.key);
}

export function secretField(gateway) {
    return definitions()[gateway]?.secret_field ?? null;
}

/**
 * A gateway is "configured" for a credential set when its designated secret
 * field is present and non-empty.
 */
export function credsConfigured(gateway, creds) {
    const field = secretField(gateway);
    if (!field) return false;
    return !!creds?.[field];
}
