/**
 * Central config, read once from the environment. Every key is documented in an
 * existing .env carries over unchanged.
 */

const bool = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return ['1', 'true', 'on', 'yes'].includes(String(value).toLowerCase());
};
const int = (value, fallback) => {
    const n = parseInt(value ?? '', 10);
    return Number.isNaN(n) ? fallback : n;
};
const str = (value, fallback = null) => (value === undefined || value === '' ? fallback : value);

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const config = {
    app: {
        name: process.env.APP_NAME || 'CallMineAI',
        env: process.env.APP_ENV || process.env.NODE_ENV || 'production',
        debug: bool(process.env.APP_DEBUG),
        url: APP_URL,
        demo_mode: bool(process.env.APP_DEMO_MODE ?? process.env.DEMO_MODE),
        installed: bool(process.env.APP_INSTALLED, true),
        timezone: 'UTC',
        locale: process.env.APP_LOCALE || 'en',
        fallback_locale: process.env.APP_FALLBACK_LOCALE || 'en',
    },

    frontend: {
        app_store_url: str(process.env.APP_STORE_URL),
        google_play_url: str(process.env.GOOGLE_PLAY_URL),
    },

    locales: {
        supported: { en: 'English', bn: 'বাংলা', ar: 'العربية' },
        rtl: ['ar'],
        fallback: process.env.APP_LOCALE || 'en',
    },

    calling: {
        credit_price_cents: int(process.env.CALL_CREDIT_PRICE_CENTS, 10),
        voice_cost_cents_per_min: int(process.env.CALL_VOICE_COST_CENTS, 10),
        number_cost_credits: int(process.env.CALL_NUMBER_COST_CREDITS, 50),
        pro_bonus_credits: int(process.env.CALL_PRO_BONUS_CREDITS, 100),
        max_retries: int(process.env.CALL_MAX_RETRIES, 3),
        dialer_concurrency: int(process.env.CALL_DIALER_CONCURRENCY, 60),
        max_turns: int(process.env.CALL_MAX_TURNS, 12),
        reply_timeout: int(process.env.CALL_REPLY_TIMEOUT, 10),
        llm_models: {
            'gpt-4o-mini': { label: 'GPT-4o Mini', cost_cents_per_min: 1 },
            'gpt-4o': { label: 'GPT-4o', cost_cents_per_min: 15 },
        },
        default_llm_model: process.env.CALL_DEFAULT_LLM || 'gpt-4o-mini',
        engines: {
            elevenlabs_twilio: {
                label: 'ElevenLabs + Twilio',
                voice: 'elevenlabs',
                telephony: 'twilio',
                dot: '#6d3fea',
            },
            openai_twilio: {
                label: 'OpenAI + Twilio',
                voice: 'openai',
                telephony: 'twilio',
                dot: '#16d9a8',
            },
            openai_plivo: {
                label: 'OpenAI + Plivo',
                voice: 'openai',
                telephony: 'plivo',
                dot: '#22c55e',
            },
        },
        default_engine: process.env.CALL_DEFAULT_ENGINE || 'elevenlabs_twilio',
    },

    voice: {
        enabled: bool(process.env.ELEVENLABS_ENABLED, true),
        api_base: process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io',
        default_api_key: str(process.env.ELEVENLABS_API_KEY),
        max_concurrency: int(process.env.ELEVENLABS_MAX_CONCURRENCY, 30),
        default_voice_id: str(process.env.ELEVENLABS_DEFAULT_VOICE_ID),
        tts_model: process.env.ELEVENLABS_TTS_MODEL || 'eleven_flash_v2_5',
        fallback_carrier_voice: process.env.TWILIO_FALLBACK_VOICE || 'Polly.Matthew',
        preview_text:
            process.env.ELEVENLABS_PREVIEW_TEXT ||
            'Hi, this is your AI calling agent. How can I help you today?',
    },

    telephony: {
        default: process.env.TELEPHONY_PROVIDER || 'twilio',
        twilio: {
            enabled: bool(process.env.TWILIO_ENABLED, true),
            account_sid: str(process.env.TWILIO_ACCOUNT_SID),
            auth_token: str(process.env.TWILIO_AUTH_TOKEN),
            default_from: str(process.env.TWILIO_DEFAULT_FROM),
            api_base: process.env.TWILIO_API_BASE || 'https://api.twilio.com',
            status_callback_url: str(process.env.TWILIO_STATUS_CALLBACK_URL),
            recording_callback_url: str(process.env.TWILIO_RECORDING_CALLBACK_URL),
            inbound_voice_url: str(process.env.TWILIO_INBOUND_VOICE_URL),
        },
        plivo: {
            enabled: bool(process.env.PLIVO_ENABLED, true),
            auth_id: str(process.env.PLIVO_AUTH_ID),
            auth_token: str(process.env.PLIVO_AUTH_TOKEN),
            default_from: str(process.env.PLIVO_DEFAULT_FROM),
            api_base: process.env.PLIVO_API_BASE || 'https://api.plivo.com',
        },
        number_cost_credits: int(process.env.CALL_NUMBER_COST_CREDITS, 50),
    },

    ai: {
        default: process.env.AI_PROVIDER || 'openai',
        providers: {
            openai: {
                enabled: bool(process.env.AI_OPENAI_ENABLED, true),
                api_key: str(process.env.OPENAI_API_KEY),
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                max_tokens: int(process.env.OPENAI_MAX_TOKENS, 4096),
            },
        },
        credits_per_generation: int(process.env.AI_CREDITS_PER_GENERATION, 10),
        rate_limit_per_minute: int(process.env.AI_RATE_LIMIT_PER_MINUTE, 20),
    },

    api: {
        enabled: bool(process.env.API_ENABLED, true),
        default_rate_limit: int(process.env.API_DEFAULT_RATE_LIMIT, 100),
        rate_window_seconds: int(process.env.API_RATE_WINDOW_SECONDS, 60),
        docs_enabled: bool(process.env.API_DOCS_ENABLED, true),
    },

    sip: {
        enabled: bool(process.env.SIP_ENABLED, true),
        default_engine: process.env.SIP_DEFAULT_ENGINE || 'elevenlabs',
        openai_realtime_model: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
    },

    messaging: {
        enabled: bool(process.env.MESSAGING_ENABLED, true),
        provider_mode: process.env.WHATSAPP_PROVIDER_MODE || 'disabled',
        meta: {
            app_id: str(process.env.META_APP_ID),
            app_secret: str(process.env.META_APP_SECRET),
            config_id: str(process.env.META_CONFIG_ID),
            verify_token: process.env.META_VERIFY_TOKEN || 'callmineai',
            graph_version: process.env.META_GRAPH_VERSION || 'v21.0',
        },
        whatsway: {
            base_url: str(process.env.WHATSWAY_BASE_URL),
            api_key: str(process.env.WHATSWAY_API_KEY),
        },
    },

    billing: {
        gateways: {
            stripe: {
                enabled: bool(process.env.BILLING_STRIPE_ENABLED),
                secret_key: str(process.env.STRIPE_SECRET),
                webhook_secret: str(process.env.STRIPE_WEBHOOK_SECRET),
                success_url: process.env.STRIPE_SUCCESS_URL || `${APP_URL}/app/billing?checkout=success`,
                cancel_url: process.env.STRIPE_CANCEL_URL || `${APP_URL}/app/pricing?checkout=canceled`,
            },
            paypal: {
                enabled: bool(process.env.BILLING_PAYPAL_ENABLED),
                client_id: str(process.env.PAYPAL_CLIENT_ID),
                client_secret: str(process.env.PAYPAL_CLIENT_SECRET),
                sandbox: bool(process.env.PAYPAL_SANDBOX, true),
                success_url: process.env.PAYPAL_SUCCESS_URL || `${APP_URL}/app/billing?checkout=success`,
                cancel_url: process.env.PAYPAL_CANCEL_URL || `${APP_URL}/app/pricing?checkout=canceled`,
                webhook_id: str(process.env.PAYPAL_WEBHOOK_ID),
            },
            paddle: {
                enabled: bool(process.env.BILLING_PADDLE_ENABLED),
                api_key: str(process.env.PADDLE_API_KEY),
                environment: process.env.PADDLE_ENVIRONMENT || 'sandbox',
                success_url: process.env.PADDLE_SUCCESS_URL || `${APP_URL}/app/billing?checkout=success`,
                cancel_url: process.env.PADDLE_CANCEL_URL || `${APP_URL}/app/pricing?checkout=canceled`,
                webhook_secret: str(process.env.PADDLE_WEBHOOK_SECRET),
            },
        },
    },

    mail: {
        from_address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
        from_name: process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'CallMineAI',
        host: str(process.env.MAIL_HOST),
        port: int(process.env.MAIL_PORT, 587),
        username: str(process.env.MAIL_USERNAME),
        password: str(process.env.MAIL_PASSWORD),
        encryption: str(process.env.MAIL_ENCRYPTION, 'tls'),
    },

    seed: {
        client_email: process.env.CLIENT_SEED_EMAIL || 'client@spagreen.net',
        client_password: process.env.CLIENT_SEED_PASSWORD || '12345678',
        admin_email: process.env.ADMIN_SEED_EMAIL || 'admin@spagreen.net',
        admin_password: process.env.ADMIN_SEED_PASSWORD || '12345678',
    },
};

/** `config('calling.engines')`-style dotted lookup. */
export function conf(path, fallback = null) {
    let node = config;
    for (const key of path.split('.')) {
        if (node === null || node === undefined) return fallback;
        node = node[key];
    }
    return node ?? fallback;
}

export default config;
