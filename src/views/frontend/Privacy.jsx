'use client';

import LegalDoc from '@/components/marketing/LegalDoc';

const SECTIONS = [
    { h: 'Introduction', body: [
        'This Privacy Policy explains how the platform (“the Service”, “we”, “us”) collects, uses, and protects information when you use the application. Because the Service is self-hosted, the operator who deploys it is the data controller for their tenants and end users; this policy describes the default behavior of the software.',
    ] },
    { h: 'Information we collect', body: [
        'We collect the following categories of information:',
        { list: [
            'Account data — name, email, password hash, role, and organization/tenant you belong to.',
            'Contact and lead data — phone numbers, names, emails and any fields you import or that agents capture during calls.',
            'Call data — recordings, transcripts, summaries, sentiment, lead scores, duration and outcome.',
            'Configuration — agents, campaigns, flows, provider credentials (stored encrypted) and settings.',
            'Billing data — plan, credit balance, invoices and payment metadata handled by your chosen gateway.',
            'Technical data — IP address, browser type, and log/audit records of sensitive actions.',
        ] },
    ] },
    { h: 'How we use information', body: [
        'Information is used to operate and improve the Service, including to:',
        { list: [
            'Place and manage calls, generate transcripts, and score leads.',
            'Authenticate users and enforce role-based access and tenant isolation.',
            'Process billing, credits and subscriptions.',
            'Provide analytics, reporting and audit trails to account administrators.',
            'Maintain security, prevent abuse and comply with legal obligations.',
        ] },
    ] },
    { h: 'Cookies', body: [
        'The Service uses strictly necessary cookies for authentication (session), security (CSRF protection) and remembering preferences such as language, currency and theme. It does not use third-party advertising cookies by default. You can control cookies through your browser, though disabling essential cookies may break sign-in.',
    ] },
    { h: 'Third-party services', body: [
        'To function, the Service connects to providers that you configure with your own credentials, such as:',
        { list: [
            'Telephony — Twilio, Plivo (to place and receive calls).',
            'Voice & AI — ElevenLabs, OpenAI (for speech and conversation).',
            'Payments — the payment gateway(s) you enable.',
            'Optional integrations — CRMs and webhooks you connect.',
        ] },
        'Data shared with these providers is governed by their respective privacy policies. You are responsible for choosing providers and obtaining any required consent.',
    ] },
    { h: 'Data security', body: [
        'The Service applies security measures including encrypted storage of provider credentials, hashed passwords, role-based access control, tenant-level data isolation, and audit logging of sensitive actions. As a self-hosted application, transport security (HTTPS), server hardening, backups and access management are the responsibility of the operator.',
    ] },
    { h: 'Data retention', body: [
        'Call recordings, transcripts, contacts and related records are retained until deleted by the account or operator, or according to retention rules the operator configures. Deleting a record removes it from the application; operators should also manage backups and any data held by third-party providers.',
    ] },
    { h: 'Your rights', body: [
        'Depending on your jurisdiction, individuals may have rights to access, correct, export or delete their personal data, and to object to or restrict certain processing. Requests should be directed to the operator of the deployment you interact with, who acts as the data controller.',
    ] },
    { h: 'Children’s privacy', body: [
        'The Service is intended for business use and is not directed to children. It should not be used to knowingly collect personal information from minors.',
    ] },
    { h: 'Changes to this policy', body: [
        'This policy may be updated to reflect changes in the software or applicable law. Material changes should be communicated to users by the operator, and the “last updated” date will be revised.',
    ] },
    { h: 'Contact', body: [
        'For privacy questions about a specific deployment, contact its operator. For questions about the software itself, contact hello@callmineai.com.',
    ] },
];

export default function Privacy() {
    return (
        <LegalDoc
            eyebrow="Legal"
            title="Privacy Policy"
            updated="2026"
            metaTitle="Privacy Policy — CallMineAI"
            description="How the AI voice-calling platform collects, uses, secures and retains data, including cookies, third-party providers, retention and user rights."
            intro="Your privacy matters. This policy describes what the platform collects, how it is used, and the choices available to you."
            sections={SECTIONS}
        />
    );
}
