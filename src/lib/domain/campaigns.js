import 'server-only';

import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';

/** Shared pieces of Client\CampaignController. */

export const TYPES = ['lead_qualification', 'sales', 'support', 'survey'];

export const STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
};

/** Wizard props shared by create() and edit(). */
export async function wizardData(clientId) {
    const client_id = BigInt(clientId);

    const [agents, numbers, contactsTotal, recentContacts] = await Promise.all([
        prisma.agent.findMany({
            where: { client_id, status: 'active', deleted_at: null },
            select: { id: true, name: true },
        }),
        prisma.phoneNumber.findMany({
            where: { client_id, status: 'active' },
            select: { id: true, e164_number: true },
        }),
        prisma.contact.count({ where: { client_id } }),
        prisma.contact.findMany({
            where: { client_id },
            orderBy: { id: 'desc' },
            take: 100,
            select: { id: true, name: true, phone: true },
        }),
    ]);

    return plain({ types: TYPES, agents, numbers, contactsTotal, recentContacts });
}

/** /update() rules. */
export function campaignRules() {
    return {
        name: ['required', 'string', 'max:255'],
        type: ['required', `in:${TYPES.join(',')}`],
        goal: ['nullable', 'string', 'max:2000'],
        agent_id: ['nullable', 'integer'],
        phone_number_id: ['nullable', 'integer'],
        max_retries: ['nullable', 'integer', 'between:0,5'],
        retry_delay_minutes: ['nullable', 'integer', 'between:1,1440'],
        schedule_start: ['nullable', 'date'],
        select_all: ['nullable', 'boolean'],
        contact_ids: ['nullable', 'array'],
    };
}

/**
 * Rule::exists('agents','id')->where('client_id', $clientId) — a foreign key must
 * belong to the same customer, or the campaign could dial with someone else's agent.
 */
export async function assertOwnedRefs(input, clientId) {
    const client_id = BigInt(clientId);
    const errors = {};

    if (input.agent_id) {
        const agent = await prisma.agent.findFirst({
            where: { id: BigInt(input.agent_id), client_id, deleted_at: null },
        });
        if (!agent) errors.agent_id = ['The selected agent id is invalid.'];
    }
    if (input.phone_number_id) {
        const number = await prisma.phoneNumber.findFirst({
            where: { id: BigInt(input.phone_number_id), client_id },
        });
        if (!number) errors.phone_number_id = ['The selected phone number id is invalid.'];
    }

    return Object.keys(errors).length ? errors : null;
}

/** Resolve the contact selection (select_all or an explicit id list). */
export async function resolveContactIds(input, clientId) {
    const client_id = BigInt(clientId);

    if (input.select_all) {
        const rows = await prisma.contact.findMany({ where: { client_id }, select: { id: true } });
        return rows.map((r) => r.id);
    }

    const ids = (input.contact_ids ?? []).map((id) => BigInt(id));
    if (!ids.length) return [];

    const rows = await prisma.contact.findMany({
        where: { client_id, id: { in: ids } },
        select: { id: true },
    });
    return rows.map((r) => r.id);
}

/** syncWithoutDetaching() on the campaign_contact pivot. */
export async function attachContacts(campaignId, contactIds) {
    if (!contactIds.length) return;

    await prisma.campaignContact.createMany({
        data: contactIds.map((contact_id) => ({
            campaign_id: campaignId,
            contact_id,
            call_status: 'pending',
            attempts: 0,
        })),
        skipDuplicates: true,
    });
}

/** sync() — replaces the pivot rows entirely. */
export async function syncContacts(campaignId, contactIds) {
    await prisma.campaignContact.deleteMany({
        where: { campaign_id: campaignId, contact_id: { notIn: contactIds.length ? contactIds : [BigInt(0)] } },
    });
    await attachContacts(campaignId, contactIds);
}
