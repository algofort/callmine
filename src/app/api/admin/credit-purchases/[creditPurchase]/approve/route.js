import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back } from '@/lib/http';
import { fulfillPurchase } from '@/lib/services/credit-purchases';

/** POST /admin/credit-purchases/{creditPurchase}/approve — ::approvePurchase() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.credit-purchases.approve', 'update_plans');
    if (gate.response) return gate.response;

    const { creditPurchase: id } = await params;
    const purchase = await prisma.creditPurchase.findUnique({ where: { id: BigInt(id) } });
    if (!purchase) return abort(404);

    await fulfillPurchase(purchase.id, {
        gateway: purchase.gateway ?? 'manual',
        admin_id: gate.admin.id,
    });

    return back({ success: 'Purchase approved and credits added.' });
});
