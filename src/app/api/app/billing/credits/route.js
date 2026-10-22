import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';
import { userCan } from '@/lib/auth';
import { abort } from '@/lib/http';
import { initiatePurchase } from '@/lib/services/credit-purchases';

/**
 * POST /app/billing/credits
 * (client.permission:billing.manage).
 */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.billing.credits.purchase' });
    if (gate.response) return gate.response;

    if (!(await userCan(gate.user, 'billing.manage'))) {
        return abort(403, 'You do not have permission to perform this action.');
    }
    if (!gate.clientId) return back({ error: 'Only customer accounts can purchase credits.' });

    const data = await validate(await readBody(request), {
        credit_package_id: ['required', 'integer'],
        gateway: ['nullable', 'string', 'in:stripe,paypal,paddle'],
    });

    const pkg = await prisma.creditPackage.findFirst({
        where: { id: BigInt(data.credit_package_id), is_active: true },
    });
    if (!pkg) return validationError({ credit_package_id: ['The selected credit package id is invalid.'] });

    await initiatePurchase(gate.clientId, pkg, data.gateway ?? null);

    return back({
        success: `Credit purchase requested for ${pkg.credits} credits. It will be added once payment is confirmed.`,
    });
});
