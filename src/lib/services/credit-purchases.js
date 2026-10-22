import 'server-only';

import prisma from '@/lib/prisma';
import { REASON, grant } from '@/lib/services/credits';

/** Port of App\Services\Credits\CreditPurchaseService. */

export const PURCHASE_STATUS = { PENDING: 'pending', PAID: 'paid', FAILED: 'failed' };

export async function initiatePurchase(clientId, pkg, gateway = null) {
    return prisma.creditPurchase.create({
        data: {
            client_id: BigInt(clientId),
            credit_package_id: pkg.id,
            credits: pkg.credits,
            amount_cents: pkg.price_cents,
            currency_code: pkg.currency_code,
            gateway,
            status: PURCHASE_STATUS.PENDING,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

/**
 * Marks a purchase paid and grants its credits, exactly once. The row is locked
 * for the duration so a duplicate webhook cannot double-credit the customer.
 */
export async function fulfillPurchase(purchaseId, opts = {}) {
    const purchase = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
            SELECT id, status, gateway, gateway_reference FROM credit_purchases
            WHERE id = ${BigInt(purchaseId)} FOR UPDATE`;
        const row = rows?.[0];
        if (!row || row.status === PURCHASE_STATUS.PAID) return null;

        return tx.creditPurchase.update({
            where: { id: BigInt(purchaseId) },
            data: {
                status: PURCHASE_STATUS.PAID,
                gateway: opts.gateway ?? row.gateway,
                gateway_reference: opts.reference ?? row.gateway_reference,
                updated_at: new Date(),
            },
        });
    });

    if (!purchase) {
        return prisma.creditPurchase.findUnique({ where: { id: BigInt(purchaseId) } });
    }

    await grant(purchase.client_id, purchase.credits, REASON.PURCHASE, {
        reference_type: 'CreditPurchase',
        reference_id: purchase.id,
        note: `Credit pack: ${purchase.credits} credits`,
        admin_id: opts.admin_id ?? null,
    });

    return prisma.creditPurchase.findUnique({ where: { id: purchase.id } });
}
