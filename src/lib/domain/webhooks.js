import 'server-only';

import prisma from '@/lib/prisma';
import { AVAILABLE_EVENTS } from '@/lib/services/webhook-dispatcher';

/** Port of Client\WebhookController's validation. */

export function webhookRules() {
    return {
        name: ['required', 'string', 'max:255'],
        target_url: ['required', 'url', 'max:2048'],
        events: ['nullable', 'array'],
        campaign_id: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
    };
}

export async function assertWebhookRefs(data, clientId) {
    const errors = {};

    for (const event of data.events ?? []) {
        if (!AVAILABLE_EVENTS.includes(event)) {
            errors.events = ['The selected event is invalid.'];
            break;
        }
    }

    if (data.campaign_id) {
        const row = await prisma.campaign.findFirst({
            where: { id: BigInt(data.campaign_id), client_id: BigInt(clientId), deleted_at: null },
        });
        if (!row) errors.campaign_id = ['The selected campaign id is invalid.'];
    }

    return Object.keys(errors).length ? errors : null;
}

export function webhookData(data) {
    return {
        name: data.name,
        target_url: data.target_url,
        events: data.events ?? [],
        campaign_id: data.campaign_id ? BigInt(data.campaign_id) : null,
        is_active: data.is_active ?? true,
    };
}
