import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import {
    integrationConfig,
    integrationEnabled,
    telephonyConfigured,
    voiceConfigured,
} from '@/lib/services/integrations';
import { poolCapacity } from '@/lib/services/elevenlabs';

/** Port of Admin\EngineController's provider metadata. */

/** provider => { field: isSecret } */
export const PROVIDER_FIELDS = {
    twilio: { account_sid: false, auth_token: true, default_from: false },
    plivo: { auth_id: false, auth_token: true, default_from: false },
    openai: { api_key: true },
};

export const PROVIDER_KIND = {
    twilio: 'telephony',
    plivo: 'telephony',
    openai: 'voice',
    elevenlabs: 'voice',
};

export const PROVIDER_LABEL = {
    twilio: 'Twilio',
    plivo: 'Plivo',
    openai: 'OpenAI',
    elevenlabs: 'ElevenLabs',
};

export async function providerConfigured(provider) {
    return PROVIDER_KIND[provider] === 'telephony'
        ? telephonyConfigured(provider)
        : voiceConfigured(provider);
}

export async function summaryState(provider, summary = null) {
    const fields = PROVIDER_FIELDS[provider] ?? {};
    const stored = await integrationConfig(provider);

    const total = Object.keys(fields).length;
    const set = Object.keys(fields).filter((f) => !!stored[f]).length;

    return {
        key: provider,
        label: PROVIDER_LABEL[provider],
        kind: PROVIDER_KIND[provider],
        configured: await providerConfigured(provider),
        enabled: await integrationEnabled(provider, true),
        summary: summary ?? (total ? `${set}/${total} credentials set` : null),
    };
}

/** — never returns the stored secret itself. */
export async function fieldState(provider) {
    const stored = await integrationConfig(provider);

    return Object.entries(PROVIDER_FIELDS[provider] ?? {}).map(([name, secret]) => ({
        name,
        secret,
        set: !!stored[name],
    }));
}

export async function elevenLabsSummary() {
    return `ElevenLabs voice pool · ${await poolCapacity()} concurrent slots`;
}

export async function openAiTestCredentials() {
    const stored = await integrationConfig('openai');
    return {
        key: stored.api_key ?? config.ai.providers.openai.api_key,
        model: stored.model ?? config.ai.providers.openai.model,
    };
}
