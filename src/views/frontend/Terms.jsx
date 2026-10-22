'use client';

import LegalDoc from '@/components/marketing/LegalDoc';

const SECTIONS = [
    { h: 'Acceptance of terms', body: [
        'By accessing or using the platform (“the Service”), you agree to be bound by these Terms & Conditions. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization. If you do not agree, do not use the Service.',
    ] },
    { h: 'License and permitted use', body: [
        'The software is provided under the license you purchased from the marketplace or vendor. Subject to that license, you are granted a right to install, run and customize the Service for your permitted number of projects or end products.',
        'Unless expressly permitted by your license, you may not resell, redistribute, or sublicense the source code itself, or remove copyright and attribution notices. Always refer to your specific purchase license for the authoritative terms.',
    ] },
    { h: 'Accounts and responsibilities', body: [
        'You are responsible for maintaining the confidentiality of account credentials and for all activity under your account. You must provide accurate information, keep your deployment secure and up to date, and ensure your use complies with all applicable laws.',
    ] },
    { h: 'Acceptable use', body: [
        'You agree not to use the Service to:',
        { list: [
            'Place calls or send messages in violation of telemarketing, consent, or do-not-call laws (e.g. TCPA, GDPR/ePrivacy and local equivalents).',
            'Harass, defraud, or deceive call recipients, or impersonate others unlawfully.',
            'Transmit unlawful, infringing, or malicious content.',
            'Attempt to breach security, disrupt the Service, or access data without authorization.',
        ] },
        'You are solely responsible for obtaining any consents required to contact individuals and for the content of your agents’ conversations.',
    ] },
    { h: 'Intellectual property', body: [
        'The Service, including its source code, design and documentation, is protected by intellectual-property laws and remains the property of its authors except for the rights expressly granted by your license. Your own data, branding and content remain yours.',
    ] },
    { h: 'Third-party services', body: [
        'The Service integrates with third-party providers (telephony, voice, AI, payments and CRMs) that you connect using your own accounts. Your use of those services is subject to their terms, and you are responsible for any fees they charge and for compliance with their policies.',
    ] },
    { h: 'Payment and billing', body: [
        'Where billing features are used, charges, credits and subscriptions are processed through the payment gateway(s) the operator configures. Fees are non-refundable except as required by law or as stated by the operator. Telephony and AI usage costs billed by third-party providers are separate and your responsibility.',
    ] },
    { h: 'Disclaimers', body: [
        'The Service is provided “as is” and “as available” without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose and non-infringement. AI-generated conversations and lead scores may be imperfect; you are responsible for reviewing outcomes and for compliance.',
    ] },
    { h: 'Limitation of liability', body: [
        'To the maximum extent permitted by law, the authors and vendors shall not be liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, data or goodwill, arising from your use of the Service. Total liability shall not exceed the amount you paid for the license.',
    ] },
    { h: 'Termination', body: [
        'Your rights under these Terms end automatically if you breach them. The operator may suspend or terminate access for violations. Upon termination, you must stop using the Service; provisions that by their nature should survive (e.g. intellectual property, disclaimers, limitation of liability) will remain in effect.',
    ] },
    { h: 'Support and updates', body: [
        'Support and updates are provided according to the marketplace or vendor policy applicable to your purchase. Updates may add, change or remove functionality. You are responsible for testing updates before deploying them to production.',
    ] },
    { h: 'Governing law', body: [
        'These Terms are governed by the laws of the jurisdiction chosen by the operator or vendor, without regard to conflict-of-law principles. You should replace this clause with the governing law appropriate to your business before production use.',
    ] },
    { h: 'Contact', body: [
        'Questions about these Terms can be sent to hello@callmineai.com, or to the operator of the specific deployment you are using.',
    ] },
];

export default function Terms() {
    return (
        <LegalDoc
            eyebrow="Legal"
            title="Terms & Conditions"
            updated="2026"
            metaTitle="Terms & Conditions — CallMineAI"
            description="The terms governing use of the AI voice-calling platform: license, acceptable use, intellectual property, liability, termination and governing law."
            intro="Please read these terms carefully. They govern your access to and use of the platform and its source code."
            sections={SECTIONS}
        />
    );
}
