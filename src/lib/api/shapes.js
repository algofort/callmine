import { iso, plain } from '@/lib/serialize';

/** The JSON shapes the V1 controllers returned. */

export function shapeCall(c, full = false) {
    const base = {
        id: Number(c.id),
        status: c.status,
        direction: c.direction,
        duration_seconds: c.duration_seconds,
        sentiment: c.sentiment,
        qualification: c.qualification,
        campaign_id: c.campaign_id ? Number(c.campaign_id) : null,
        agent_id: c.agent_id ? Number(c.agent_id) : null,
        contact_id: c.contact_id ? Number(c.contact_id) : null,
        created_at: iso(c.created_at),
    };

    if (full) {
        base.transcript = c.transcript;
        base.summary = c.summary;
        base.recording_url = c.recording_url;
    }

    return base;
}

export function shapeCampaign(c) {
    return {
        id: Number(c.id),
        name: c.name,
        type: c.type,
        status: c.status,
        agent_id: c.agent_id ? Number(c.agent_id) : null,
        phone_number_id: c.phone_number_id ? Number(c.phone_number_id) : null,
        contacts_count: c._count?.campaign_contact ?? null,
        calls_count: c._count?.calls ?? null,
        stats: plain(c.stats ?? null),
    };
}

export function shapeAgent(a) {
    return {
        id: Number(a.id),
        name: a.name,
        status: a.status,
        language: a.language,
        llm_model: a.llm_model,
        voice_id: a.voice_id ? Number(a.voice_id) : null,
        cost_per_minute_cents: a.cost_per_minute_cents,
    };
}

export function shapeContact(c) {
    return {
        id: Number(c.id),
        name: c.name,
        phone: c.phone,
        email: c.email,
        company: c.company,
        source: c.source,
        created_at: iso(c.created_at),
    };
}

/** `min(100, per_page ?? 25)` */
export function perPageFrom(request) {
    const value = Number(new URL(request.url).searchParams.get('per_page') ?? 25);
    return Math.min(100, Number.isFinite(value) && value > 0 ? value : 25);
}

export function pageFrom(request) {
    const value = Number(new URL(request.url).searchParams.get('page') ?? 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
}
