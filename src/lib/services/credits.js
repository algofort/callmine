import 'server-only';

import prisma from '@/lib/prisma';
import { planFor } from '@/lib/plans';

/**
 * Every movement appends one credit_ledger row carrying the running
 * balance_after. 1 credit ≈ 1 call minute.
 */

export const REASON = {
    PLAN_GRANT: 'plan_grant',
    MONTHLY_BONUS: 'monthly_bonus',
    PURCHASE: 'purchase',
    CALL_CHARGE: 'call_charge',
    NUMBER_CHARGE: 'number_charge',
    ADMIN_ADJUST: 'admin_adjust',
    REFUND: 'refund',
};

export class InsufficientCreditsError extends Error {
    constructor(required, available) {
        super(`Insufficient credits: need ${required}, have ${available}.`);
        this.name = 'InsufficientCreditsError';
        this.required = required;
        this.available = available;
    }
}

export async function balance(clientId) {
    if (!clientId) return 0;
    const row = await prisma.creditLedger.findFirst({
        where: { client_id: BigInt(clientId) },
        orderBy: { id: 'desc' },
        select: { balance_after: true },
    });
    return Number(row?.balance_after ?? 0);
}

export async function hasCredits(clientId, credits) {
    return (await balance(clientId)) >= credits;
}

/**
 * Append a ledger row inside a transaction so balance_after stays consistent
 * under concurrency. A debit that would go below zero is rejected.
 */
export async function record(clientId, delta, reason, opts = {}) {
    const client_id = BigInt(clientId);

    return prisma.$transaction(async (tx) => {
        // SELECT ... FOR UPDATE on the latest row so concurrent debits cannot race.
        const rows = await tx.$queryRaw`
            SELECT balance_after FROM credit_ledger
            WHERE client_id = ${client_id}
            ORDER BY id DESC LIMIT 1 FOR UPDATE`;
        const current = Number(rows?.[0]?.balance_after ?? 0);

        const newBalance = current + delta;
        if (newBalance < 0) throw new InsufficientCreditsError(Math.abs(delta), current);

        return tx.creditLedger.create({
            data: {
                client_id,
                delta,
                balance_after: newBalance,
                reason,
                reference_type: opts.reference_type ?? null,
                reference_id: opts.reference_id ? BigInt(opts.reference_id) : null,
                note: opts.note ?? null,
                created_by_admin_id: opts.admin_id ? BigInt(opts.admin_id) : null,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    });
}

export async function grant(clientId, credits, reason, opts = {}) {
    return record(clientId, Math.abs(credits), reason, opts);
}

export async function charge(clientId, credits, reason, opts = {}) {
    return record(clientId, -Math.abs(credits), reason, opts);
}

/** Grants ai_credits + monthly_bonus_credits once per calendar month. */
export async function monthlyGrantForPlan(clientId) {
    const plan = await planFor(clientId);
    if (!plan) return null;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const already = await prisma.creditLedger.findFirst({
        where: {
            client_id: BigInt(clientId),
            reason: REASON.PLAN_GRANT,
            created_at: { gte: startOfMonth },
        },
    });
    if (already) return null;

    const credits = Number(plan.ai_credits ?? 0) + Number(plan.monthly_bonus_credits ?? 0);
    if (credits <= 0) return null;

    return grant(clientId, credits, REASON.PLAN_GRANT, { note: `Monthly plan credits: ${plan.name}` });
}

/** Charge a completed call (1 credit per started minute), clamped to the balance. */
export async function chargeForCall(call) {
    const credits = Math.ceil(Math.max(0, Number(call.duration_seconds ?? 0)) / 60);
    if (credits <= 0 || !call.client_id) return null;

    const available = await balance(call.client_id);
    const toCharge = Math.min(credits, available);
    if (toCharge <= 0) return null;

    const entry = await charge(call.client_id, toCharge, REASON.CALL_CHARGE, {
        reference_type: 'Call',
        reference_id: call.id,
        note: `Call ${call.id} (${call.duration_seconds}s)`,
    });

    await prisma.call.update({
        where: { id: call.id },
        data: { credits_charged: toCharge, updated_at: new Date() },
    });

    return entry;
}

export async function chargeNumberMonthly(number) {
    const credits = Number(number.monthly_cost_credits ?? 0);
    if (credits <= 0 || !number.client_id) return null;

    return charge(number.client_id, credits, REASON.NUMBER_CHARGE, {
        reference_type: 'PhoneNumber',
        reference_id: number.id,
        note: `Monthly number fee: ${number.e164_number}`,
    });
}
