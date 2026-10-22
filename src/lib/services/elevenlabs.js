import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { integrationConfig } from '@/lib/services/integrations';

/**
 * Port of App\Services\Voice\ElevenLabsService + ElevenLabsKeyPool.
 * Stateless HTTP client; callers pass the key (admin pool row, raw string, or
 * null for the env fallback).
 */

export const KEY_STATUS = { ACTIVE: 'active', UNHEALTHY: 'unhealthy', DISABLED: 'disabled' };

function base() {
    return String(config.voice.api_base).replace(/\/+$/, '');
}

async function apiKeyFor(key) {
    if (key && typeof key === 'object') return key.api_key;
    if (key) return key;
    const stored = await integrationConfig('elevenlabs');
    return stored.api_key || config.voice.default_api_key;
}

export async function health(key) {
    const apiKey = await apiKeyFor(key);
    if (!apiKey) return { ok: false, error: 'No API key' };

    try {
        const res = await fetch(`${base()}/v1/user/subscription`, {
            headers: { 'xi-api-key': apiKey },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
        return { ok: true, subscription: await res.json() };
    } catch (e) {
        console.warn('[elevenlabs] health check failed:', e?.message);
        return { ok: false, error: e?.message };
    }
}

export async function listVoices(key) {
    const apiKey = await apiKeyFor(key);
    if (!apiKey) return [];

    try {
        const res = await fetch(`${base()}/v1/voices`, {
            headers: { 'xi-api-key': apiKey },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.voices ?? [];
    } catch (e) {
        console.warn('[elevenlabs] listVoices failed:', e?.message);
        return [];
    }
}

/** — returns raw mpeg bytes or null. */
export async function synthesize(text, voiceExternalId, key = null, options = {}) {
    const apiKey = await apiKeyFor(key);
    if (!apiKey || !voiceExternalId) return null;

    const query = new URLSearchParams();
    if (options.latency !== undefined && options.latency !== null) {
        query.set('optimize_streaming_latency', String(options.latency));
    }
    if (options.output_format) query.set('output_format', options.output_format);

    const qs = query.toString();
    const url = `${base()}/v1/text-to-speech/${voiceExternalId}${qs ? `?${qs}` : ''}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey, Accept: 'audio/mpeg', 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, model_id: config.voice.tts_model }),
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        console.warn('[elevenlabs] synthesize failed:', e?.message);
        return null;
    }
}

export async function isConfigured() {
    const active = await prisma.elevenLabsKey.count({ where: { status: KEY_STATUS.ACTIVE } }).catch(() => 0);
    return active > 0 || !!config.voice.default_api_key;
}

/* ------------------------------------------------------------- key pool */

export async function poolCapacity() {
    const agg = await prisma.elevenLabsKey.aggregate({
        where: { status: KEY_STATUS.ACTIVE },
        _sum: { max_concurrency: true },
    });
    return Number(agg._sum.max_concurrency ?? 0);
}

export async function poolLoad() {
    const agg = await prisma.elevenLabsKey.aggregate({
        where: { status: KEY_STATUS.ACTIVE },
        _sum: { current_load: true },
    });
    return Number(agg._sum.current_load ?? 0);
}

export async function poolUtilization() {
    const cap = await poolCapacity();
    return cap > 0 ? Math.round(((await poolLoad()) / cap) * 1000) / 10 : 0;
}

export async function poolTotalAgents() {
    const agg = await prisma.elevenLabsKey.aggregate({ _sum: { agents_count: true } });
    return Number(agg._sum.agents_count ?? 0);
}

/** Reserve a slot on the least-loaded healthy key; null when saturated. */
export async function acquireKey() {
    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
            SELECT id FROM elevenlabs_keys
            WHERE status = 'active' AND current_load < max_concurrency
            ORDER BY current_load ASC LIMIT 1 FOR UPDATE`;
        const id = rows?.[0]?.id;
        if (!id) return null;

        return tx.elevenLabsKey.update({
            where: { id: BigInt(id) },
            data: { current_load: { increment: 1 }, updated_at: new Date() },
        });
    });
}

export async function releaseKey(key) {
    if (!key || Number(key.current_load ?? 0) <= 0) return;
    await prisma.elevenLabsKey
        .update({ where: { id: key.id }, data: { current_load: { decrement: 1 }, updated_at: new Date() } })
        .catch(() => {});
}

export async function healthCheckAll() {
    const keys = await prisma.elevenLabsKey.findMany();
    let healthy = 0;

    for (const key of keys) {
        const result = await health(key);
        await prisma.elevenLabsKey.update({
            where: { id: key.id },
            data: {
                status: result.ok ? KEY_STATUS.ACTIVE : KEY_STATUS.UNHEALTHY,
                last_health_check_at: new Date(),
                updated_at: new Date(),
            },
        });
        if (result.ok) healthy++;
    }

    return { checked: keys.length, healthy };
}

export async function syncVoices() {
    const key = await prisma.elevenLabsKey.findFirst({
        where: { status: KEY_STATUS.ACTIVE },
        orderBy: { label: 'asc' },
    });
    const source = key ?? config.voice.default_api_key;
    if (!source) return { synced: 0, key: null };

    const voices = await listVoices(key ?? source);
    let synced = 0;

    for (const v of voices) {
        const labels = v.labels ?? {};
        const external_id = v.voice_id ?? null;
        if (!external_id) continue;

        const data = {
            name: v.name ?? 'Voice',
            gender: labels.gender ?? null,
            age_group: labels.age ?? null,
            tone: labels.description ?? v.category ?? null,
            best_for: labels.use_case ?? labels['use case'] ?? null,
            accent: labels.accent ?? null,
            language: labels.language ?? 'en',
            preview_url: v.preview_url ?? null,
            is_active: true,
            elevenlabs_key_id: key?.id ?? null,
            meta: { category: v.category ?? null },
            updated_at: new Date(),
        };

        await prisma.voice.upsert({
            where: { external_id },
            create: { external_id, ...data, created_at: new Date() },
            update: data,
        });
        synced++;
    }

    // Retire voices the account no longer returns, so the library only lists
    // real, playable voices.
    if (synced > 0) {
        const liveIds = voices.map((v) => v.voice_id).filter(Boolean);
        await prisma.voice.updateMany({
            where: { external_id: { notIn: liveIds } },
            data: { is_active: false, updated_at: new Date() },
        });
    }

    return { synced, key: key?.label ?? null };
}
