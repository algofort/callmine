import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { normalizeVoucher, voucherRules } from '@/lib/domain/marketing';

/** POST /app/marketing/vouchers */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.marketing.vouchers.store' });
    if (gate.response) return gate.response;

    const validated = await validate(await readBody(request), voucherRules());
    const data = await normalizeVoucher(validated, gate.clientId);

    await prisma.marketingVoucher.create({
        data: {
            ...data,
            client_id: BigInt(gate.clientId),
            usage_count: 0,
            total_discount_amount: 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/marketing/vouchers', { success: 'Voucher created.' });
});
