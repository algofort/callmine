import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { decryptString, encryptString } from '@/lib/crypt';

/**
 * Port of App\Models\IntegrationSetting — DB-backed provider credentials and
 * enable flags. The `config` column holds an encrypted JSON object, so it
 * is read/written through the same AES payload format.
 */

export async function integrationConfig(key) {
    try {
        const row = await prisma.integrationSetting.findFirst({ where: { key } });
        if (!row?.config) return {};
        const json = decryptString(row.config) ?? row.config;
        const parsed = JSON.parse(json);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export async function integrationEnabled(key, fallback = true) {
    try {
        const row = await prisma.integrationSetting.findFirst({
            where: { key },
            select: { enabled: true },
        });
        return row ? !!row.enabled : fallback;
    } catch {
        return fallback;
    }
}

/** — merges into the existing credential map. */
export async function putIntegration(key, credentials = null, enabled = null) {
    const existing = await prisma.integrationSetting.findFirst({ where: { key } });
    const merged = credentials === null ? null : { ...(await integrationConfig(key)), ...credentials };

    const data = {
        ...(merged !== null ? { config: encryptString(JSON.stringify(merged)) } : {}),
        ...(enabled !== null ? { enabled } : {}),
        updated_at: new Date(),
    };

    if (existing) return prisma.integrationSetting.update({ where: { id: existing.id }, data });
    return prisma.integrationSetting.create({
        data: { key, enabled: enabled ?? true, ...data, created_at: new Date() },
    });
}

/* ------------------------------------------------------------- engines */

export function engineCatalog() {
    return config.calling.engines;
}

export function voiceKeyFor(engine) {
    return engineCatalog()[engine]?.voice ?? 'elevenlabs';
}

export function telephonyKeyFor(engine) {
    return engineCatalog()[engine]?.telephony ?? 'twilio';
}

export function defaultEngine() {
    return config.calling.default_engine;
}

/** TwilioService/ */
export async function telephonyConfigured(provider) {
    const stored = await integrationConfig(provider);
    if (provider === 'twilio') {
        const sid = stored.account_sid || config.telephony.twilio.account_sid;
        const token = stored.auth_token || config.telephony.twilio.auth_token;
        return !!sid && !!token && (await integrationEnabled('twilio', config.telephony.twilio.enabled));
    }
    if (provider === 'plivo') {
        const id = stored.auth_id || config.telephony.plivo.auth_id;
        const token = stored.auth_token || config.telephony.plivo.auth_token;
        return !!id && !!token && (await integrationEnabled('plivo', config.telephony.plivo.enabled));
    }
    return false;
}

/** ElevenLabsVoiceProvider/ */
export async function voiceConfigured(provider) {
    if (provider === 'elevenlabs') {
        if (!(await integrationEnabled('elevenlabs', true))) return false;
        const stored = await integrationConfig('elevenlabs');
        const anyKey = await prisma.elevenLabsKey.count({ where: { status: 'active' } }).catch(() => 0);
        return anyKey > 0 || !!stored.api_key || !!config.voice.default_api_key;
    }
    if (provider === 'openai') {
        if (!(await integrationEnabled('openai', true))) return false;
        const stored = await integrationConfig('openai');
        return !!stored.api_key || !!config.ai.providers.openai.api_key;
    }
    return false;
}

export async function engineIsConfigured(engine) {
    return (
        (await telephonyConfigured(telephonyKeyFor(engine))) &&
        (await voiceConfigured(voiceKeyFor(engine)))
    );
}

export async function engineIsEnabled(engine) {
    return integrationEnabled(`engine:${engine}`, true);
}

export async function allEngines() {
    const out = [];
    for (const [key, e] of Object.entries(engineCatalog())) {
        out.push({
            key,
            label: e.label,
            voice: e.voice,
            telephony: e.telephony,
            dot: e.dot ?? '#6d3fea',
            enabled: await engineIsEnabled(key),
            configured: await engineIsConfigured(key),
        });
    }
    return out;
}

export async function enginesForUi() {
    return (await allEngines())
        .filter((e) => e.enabled)
        .map((e) => ({ value: e.key, label: e.label, dot: e.dot }));
}

/** Resolve a provider credential: DB first, then config/env. */
export async function providerCredential(provider, key, fallback = null) {
    const stored = await integrationConfig(provider);
    if (stored[key]) return stored[key];

    const map = {
        twilio: config.telephony.twilio,
        plivo: config.telephony.plivo,
        openai: config.ai.providers.openai,
        elevenlabs: { api_key: config.voice.default_api_key },
    };
    return map[provider]?.[key] ?? fallback;
}
