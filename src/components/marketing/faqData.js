'use client';

// Shared FAQ content — powers the home preview, the FAQ page, and FAQPage schema.
export const FAQ_GROUPS = [
    {
        group: 'Product & usage',
        items: [
            { q: 'What is this product?', a: 'A complete AI voice-calling platform. You build AI agents that place outbound phone calls, hold natural conversations, qualify leads Hot / Warm / Cold, and push the results to your CRM — all managed from a customer dashboard, with a full super-admin panel on top for running it as a SaaS.' },
            { q: 'Who is it for?', a: 'Outbound sales and SDR teams, agencies that want to resell AI calling to clients, recruiters, real-estate teams, survey and research firms, and any business that qualifies leads over the phone. Because it is multi-tenant, it also fits founders launching their own AI-calling SaaS.' },
            { q: 'Do I need to know how the AI works to use it?', a: 'No. You pick a voice, set the agent’s goal and personality, drop in a knowledge base, and launch a campaign. The agent handles the conversation. Everything is configured through the dashboard — no code required for day-to-day use.' },
            { q: 'What languages are supported?', a: 'The platform ships with 29 interface languages and supports multilingual calling with region-specific accents, so agents can detect and speak in the caller’s language.' },
        ],
    },
    {
        group: 'Installation & requirements',
        items: [
            { q: 'What do I need to run it?', a: 'Node.js 20 LTS or newer, npm 10+, and MySQL 8 / MariaDB 10.4+. Because the dialer runs as a background worker that must stay alive, you need a host that allows long-running processes — a VPS, a dedicated server or a container host. Shared hosting that kills background processes will not run the calling engine.' },
            { q: 'How long does installation take?', a: 'A typical install is a few minutes: npm install, configure your .env, push the database schema, seed it, run the production build, then start the app and its background worker. Full setup steps are included in the documentation.' },
            { q: 'Is it self-hosted?', a: 'Yes. You own and host the entire application and its data. There is no forced third-party runtime — you connect your own telephony, voice and AI provider keys.' },
        ],
    },
    {
        group: 'Integrations & AI',
        items: [
            { q: 'Which calling and AI providers are supported?', a: 'Telephony via Twilio and Plivo (bring your own account), voice via ElevenLabs and OpenAI, and LLMs via OpenAI. Providers are selected per agent as an “engine” (e.g. ElevenLabs + Twilio, OpenAI + Plivo) and managed centrally by the admin.' },
            { q: 'Can I connect my CRM?', a: 'Yes. Qualified leads and call data can be pushed to Salesforce, HubSpot, Pipedrive or any endpoint via webhooks, plus a REST API with API keys for custom integrations.' },
            { q: 'Does it include automation?', a: 'Yes — a visual flow builder lets you branch on call outcomes (e.g. if Hot → send SMS, book a callback, or escalate to a human), plus SMS/WhatsApp/email messaging, forms, appointments, and a Google Sheets sync.' },
        ],
    },
    {
        group: 'Licensing, updates & support',
        items: [
            { q: 'How does licensing work?', a: 'It is sold as a one-time purchase per the marketplace license. You get the full source code to self-host and customize. Review the specific license terms on the purchase page for permitted use and any per-project rules.' },
            { q: 'Do I get updates?', a: 'Yes. Ongoing updates ship with new features, fixes and provider improvements. Because you have the source, you can also extend and adapt it yourself.' },
            { q: 'Is support included?', a: 'Yes — buyer support for installation questions and bug fixes is included per the marketplace support policy. Documentation covers setup, configuration and common tasks.' },
            { q: 'Can I customize or white-label it?', a: 'Fully. Branding (name, logo, colors), languages, currencies and email templates are configurable from the admin panel, and the clean, modular codebase makes deeper customization straightforward.' },
        ],
    },
    {
        group: 'Security & billing',
        items: [
            { q: 'How is my data handled?', a: 'All tenant data is isolated per account (multi-tenant scoping on every model), provider credentials are stored encrypted, and role-based access control governs who can see what. You host it, so your data never leaves your infrastructure.' },
            { q: 'Does it handle payments and subscriptions?', a: 'Yes. It includes credit-based billing, subscription plans, multiple payment gateways, invoices, and a full super-admin view of customers, subscriptions and payments.' },
            { q: 'Is it production-ready?', a: 'The application is code-complete with a passing automated test suite. To place real calls you add your own provider credentials and run a queue worker; before production, apply standard hardening (production env, HTTPS, backups).' },
        ],
    },
];

export const FAQ_FLAT = FAQ_GROUPS.flatMap((g) => g.items);
