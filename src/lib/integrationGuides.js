'use client';

// Central copy for the in-app <SetupGuide guide="<key>" /> panels.
// Each entry: { title, intro, steps: [{ text, href?, linkText?, code? }], notes?: [] }

export const INTEGRATION_GUIDES = {
    // ── Voice & AI ────────────────────────────────────────────────
    elevenlabs: {
        title: 'ElevenLabs voices',
        intro: 'ElevenLabs generates the lifelike agent voices. Add one or more API keys to build a load-balanced pool.',
        steps: [
            { text: 'Create an ElevenLabs account and open your profile.', href: 'https://elevenlabs.io/app/settings/api-keys', linkText: 'ElevenLabs API keys' },
            { text: 'Generate an API key and copy it.' },
            { text: 'Add the key here with a label and a concurrency cap (how many simultaneous calls this key may handle).' },
            { text: 'Run Health check to confirm the key works, then Sync voices to import the voice library.' },
        ],
        notes: [
            'Add several keys to raise total concurrency — the dialer never exceeds the pool capacity.',
            'Sync voices retires placeholder/stale voices; run it after adding a key.',
        ],
    },
    openai: {
        title: 'OpenAI (LLM brain)',
        intro: 'OpenAI powers the agent conversation and call analysis (sentiment + lead scoring).',
        steps: [
            { text: 'Create an OpenAI account and open the API keys page.', href: 'https://platform.openai.com/api-keys', linkText: 'OpenAI API keys' },
            { text: 'Create a secret key (starts with sk-…) and copy it.' },
            { text: 'Paste it here and save. The default model is', code: 'gpt-4o-mini' },
            { text: 'Use Test to verify the key reaches OpenAI.' },
        ],
        notes: ['Billing is on your OpenAI account. Ensure the key has usage quota / a payment method.'],
    },

    // ── Telephony ─────────────────────────────────────────────────
    twilio: {
        title: 'Twilio telephony',
        intro: 'Twilio places the outbound calls and delivers recordings.',
        steps: [
            { text: 'Create a Twilio account and open the Console.', href: 'https://console.twilio.com', linkText: 'Twilio Console' },
            { text: 'Copy the Account SID and Auth Token from the dashboard.' },
            { text: 'Buy (or verify) a phone number to call from.' },
            { text: 'Paste the SID, Auth Token and default From number here, then Test.' },
        ],
        notes: [
            'Without credentials you can still add numbers manually, but search/buy and live calling are disabled.',
            'Twilio calls back to your app — the status/recording webhook URLs must be reachable over public HTTPS.',
        ],
    },
    plivo: {
        title: 'Plivo telephony',
        intro: 'Plivo is an alternative telephony provider for placing calls.',
        steps: [
            { text: 'Create a Plivo account and open the Console.', href: 'https://console.plivo.com', linkText: 'Plivo Console' },
            { text: 'Copy your Auth ID and Auth Token.' },
            { text: 'Rent a phone number to call from.' },
            { text: 'Paste the Auth ID, Auth Token and default From number here, then Test.' },
        ],
        notes: ['Webhooks require a public HTTPS URL, same as Twilio.'],
    },
    sip: {
        title: 'SIP trunk',
        intro: 'Bring your own carrier and route calls over a SIP trunk instead of (or alongside) Twilio.',
        steps: [
            { text: 'Get SIP credentials from your carrier (host, port, transport, username, password).' },
            { text: 'Add a trunk here — pick a provider template to auto-fill host/port/transport.' },
            { text: 'Choose the engine: ElevenLabs (inbound + outbound + recording) or OpenAI Realtime (inbound only).' },
            { text: 'Import a SIP number and assign it to an agent.' },
        ],
        notes: [
            'Credentials are encrypted and never shown again after saving.',
            'OpenAI Realtime engine rejects outbound numbers — use it for inbound only.',
        ],
    },

    // ── Payments ──────────────────────────────────────────────────
    stripe: {
        title: 'Stripe payments',
        intro: 'Stripe processes subscription checkouts.',
        steps: [
            { text: 'Open the Stripe Dashboard → Developers → API keys.', href: 'https://dashboard.stripe.com/apikeys', linkText: 'Stripe API keys' },
            { text: 'Copy the Secret key (sk_live_… or sk_test_…).' },
            { text: 'Add a webhook endpoint for your domain and copy its Signing secret (whsec_…).', href: 'https://dashboard.stripe.com/webhooks', linkText: 'Stripe webhooks' },
            { text: 'Paste the secret key + webhook secret here and enable the gateway.' },
        ],
        notes: ['Use test keys while developing; switch to live keys only in production.'],
    },
    paypal: {
        title: 'PayPal payments',
        intro: 'PayPal processes subscription checkouts.',
        steps: [
            { text: 'Open the PayPal Developer Dashboard → Apps & Credentials.', href: 'https://developer.paypal.com/dashboard/applications', linkText: 'PayPal apps' },
            { text: 'Create an app and copy the Client ID and Secret.' },
            { text: 'Copy the Webhook ID for your app.' },
            { text: 'Paste them here. Keep Sandbox on for testing; turn it off for live.' },
        ],
        notes: ['Sandbox and live use different credentials — do not mix them.'],
    },
    paddle: {
        title: 'Paddle payments',
        intro: 'Paddle processes subscription checkouts.',
        steps: [
            { text: 'Open the Paddle Dashboard → Developer Tools → Authentication.', href: 'https://vendors.paddle.com', linkText: 'Paddle Dashboard' },
            { text: 'Copy your API key.' },
            { text: 'Create a webhook/notification destination and copy its secret.' },
            { text: 'Paste the API key + webhook secret here. Keep Environment on sandbox for testing.' },
        ],
        notes: ['Sandbox vs production are separate environments with separate keys.'],
    },
    razorpay: {
        title: 'Razorpay subscriptions',
        intro: 'Razorpay handles recurring subscription billing (Plans + Subscriptions).',
        steps: [
            { text: 'Open the Razorpay Dashboard → Settings → API Keys.', href: 'https://dashboard.razorpay.com/app/keys', linkText: 'Razorpay API keys' },
            { text: 'Generate a key and copy the Key ID (rzp_…) and Key Secret.' },
            { text: 'Create a webhook, set the URL shown here, choose a secret, and subscribe to subscription.* events.', href: 'https://dashboard.razorpay.com/app/webhooks', linkText: 'Razorpay webhooks' },
            { text: 'Paste the Key ID, Key Secret and the same webhook secret here, then enable.' },
        ],
        notes: ['The webhook secret you set on Razorpay must match the one entered here or events are rejected.'],
    },
    paystack: {
        title: 'Paystack subscriptions',
        intro: 'Paystack charges the saved card each cycle after the first hosted payment.',
        steps: [
            { text: 'Open the Paystack Dashboard → Settings → API Keys & Webhooks.', href: 'https://dashboard.paystack.com/#/settings/developers', linkText: 'Paystack API keys' },
            { text: 'Copy the Secret Key (sk_…) and (optionally) the Public Key.' },
            { text: 'Set the Webhook URL to the URL shown here.' },
            { text: 'Paste the keys here and enable. Webhooks are verified with your secret key.' },
        ],
        notes: ['Use test keys while developing; switch to live keys only in production.'],
    },
    cashfree: {
        title: 'Cashfree subscriptions',
        intro: 'Cashfree processes recurring subscriptions via a hosted authorization link.',
        steps: [
            { text: 'Enable the Subscriptions product and open Developers → API Keys.', href: 'https://merchant.cashfree.com/merchants/pg/developers/api-keys', linkText: 'Cashfree API keys' },
            { text: 'Copy the App ID and Secret Key.' },
            { text: 'Add a webhook pointing to the URL shown here (signed webhooks recommended).' },
            { text: 'Paste the App ID + Secret Key here. Keep Test Mode on for sandbox.' },
        ],
        notes: ['The Subscriptions product must be enabled on your Cashfree account.'],
    },
    xendit: {
        title: 'Xendit recurring',
        intro: 'Xendit handles recurring payments via Customers + Recurring Plans.',
        steps: [
            { text: 'Open the Xendit Dashboard → Settings → API Keys and create a secret key.', href: 'https://dashboard.xendit.co/settings/developers#api-keys', linkText: 'Xendit API keys' },
            { text: 'Open Settings → Webhooks, set the callback URL shown here, and copy the Verification (callback) Token.' },
            { text: 'Paste the Secret API Key + callback token here and enable.' },
        ],
        notes: ['The callback token is compared against the x-callback-token header on every webhook.'],
    },
    myfatoorah: {
        title: 'MyFatoorah recurring',
        intro: 'MyFatoorah bills a recurring invoice each cycle (RecurringModel).',
        steps: [
            { text: 'Open the MyFatoorah portal → Integration Settings and copy your API Token.', href: 'https://portal.myfatoorah.com', linkText: 'MyFatoorah portal' },
            { text: 'Set the API Base URL for your account (e.g. https://apitest.myfatoorah.com for test).' },
            { text: 'Configure a webhook to the URL shown here and copy the webhook secret.' },
            { text: 'Paste the API Token, Base URL and webhook secret here, then enable.' },
        ],
        notes: ['Base URLs are country + environment specific — use the exact URL from your account.'],
    },
    tap: {
        title: 'Tap payments',
        intro: 'Tap (MENA) processes a one-time card charge per checkout (no auto-renewal).',
        steps: [
            { text: 'Open the Tap Dashboard → Developers → API Credentials.', href: 'https://www.tap.company', linkText: 'Tap dashboard' },
            { text: 'Copy the Secret Key (sk_…) and Publishable Key (pk_…).' },
            { text: 'Set the webhook / post URL to the URL shown here.' },
            { text: 'Paste the keys here and enable.' },
        ],
        notes: ['Tap here bills a single period — the customer is not charged automatically next cycle.'],
    },
    paymob: {
        title: 'Paymob payments',
        intro: 'Paymob processes a one-time card payment via the iframe flow (no auto-renewal).',
        steps: [
            { text: 'Open the Paymob Dashboard → Settings → Account Info and copy the API Key.', href: 'https://accept.paymob.com', linkText: 'Paymob dashboard' },
            { text: 'Copy the online-card Integration ID and the iFrame ID.' },
            { text: 'Set the Transaction Processed Callback to the URL shown here and copy the HMAC secret.' },
            { text: 'Paste the API Key, Integration ID, iFrame ID and HMAC secret here, then enable.' },
        ],
        notes: ['Paymob here bills a single period — recurring renewal is not automated.'],
    },

    // ── Messaging ─────────────────────────────────────────────────
    'whatsapp-meta': {
        title: 'WhatsApp — Meta Cloud API',
        intro: 'Send and receive WhatsApp messages through the official Meta Cloud API.',
        steps: [
            { text: 'Create a Meta app and add the WhatsApp product.', href: 'https://developers.facebook.com/apps', linkText: 'Meta for Developers' },
            { text: 'Copy the App ID and App Secret.' },
            { text: 'Set a Verify token (any string) and use it in the webhook configuration.' },
            { text: 'Add the callback URL from this page to your Meta app’s WhatsApp webhook, and subscribe to message events.' },
        ],
        notes: ['The Verify token you enter here must match the one set in the Meta webhook config, or verification fails.'],
    },
    whatsway: {
        title: 'WhatsApp — WhatsWay',
        intro: 'Use a self-hosted WhatsWay instance as the WhatsApp provider.',
        steps: [
            { text: 'Deploy or open your WhatsWay instance and locate its API base URL.' },
            { text: 'Generate an API key in WhatsWay.' },
            { text: 'Paste the base URL and API key here and set the provider mode.' },
        ],
    },

    // ── Auth / Email / Data ───────────────────────────────────────
    firebase: {
        title: 'Firebase social login (Google)',
        intro: 'Let users sign in with Google using Firebase Authentication.',
        steps: [
            { text: 'Create a Firebase project and register a Web app.', href: 'https://console.firebase.google.com', linkText: 'Firebase Console' },
            { text: 'Copy the web config: apiKey, authDomain, projectId, appId (+ optional sender ID / storage bucket).' },
            { text: 'Authentication → Sign-in method → enable the Google provider.' },
            { text: 'Authentication → Settings → Authorized domains → add your site’s domain (and localhost for dev).' },
            { text: 'Paste the web config here, enable social login, and save.' },
        ],
        notes: [
            'authDomain is usually your-project-id.firebaseapp.com — not the site URL.',
            'If sign-in fails with auth/internal-error, check that the Web API key is not over-restricted and the Identity Toolkit API is enabled.',
        ],
    },
    smtp: {
        title: 'Email (SMTP)',
        intro: 'Configure an SMTP server so the platform can send email (verification, notifications, templates).',
        steps: [
            { text: 'Get SMTP credentials from your email provider (host, port, username, password, encryption).' },
            { text: 'Add a configuration here and set it active.' },
            { text: 'Use Send test email to confirm delivery.' },
        ],
        notes: ['Common ports: 587 (TLS) or 465 (SSL). Use a dedicated sending domain for best deliverability.'],
    },
    webhooks: {
        title: 'Webhooks',
        intro: 'Push call and lead events to your own systems in real time.',
        steps: [
            { text: 'Create an endpoint on your server that accepts POST JSON.' },
            { text: 'Add the endpoint URL here and pick the events to send.' },
            { text: 'Copy the signing secret (whsec_…) and verify the X-CallMineAI-Signature HMAC on your side.' },
            { text: 'Use Test to send a sample payload.' },
        ],
        notes: ['Non-2xx responses are retried. Always return 200 quickly and process asynchronously.'],
    },
    'api-keys': {
        title: 'REST API keys',
        intro: 'Connect your own apps to the platform over the REST API.',
        steps: [
            { text: 'Create a key here and choose its scopes (least privilege).' },
            { text: 'Copy the full key now — the secret is shown only once.' },
            { text: 'Send it as a Bearer token:', code: 'Authorization: Bearer <key>' },
            { text: 'Explore endpoints in the API playground (Swagger).' },
        ],
        notes: ['If a key leaks, revoke it here immediately and issue a new one.'],
    },
    'google-sheets': {
        title: 'Google Sheets',
        intro: 'Push form and appointment data into a Google Sheet.',
        steps: [
            { text: 'Connect your Google account and grant Sheets access.' },
            { text: 'Choose which data to sync (forms, appointments).' },
            { text: 'Pick or create the destination spreadsheet.' },
        ],
    },
};
