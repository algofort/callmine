import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { normalizeVoucher, voucherRules } from '@/lib/domain/marketing';

/** PUT /app/marketing/vouchers/{marketingVoucher} — ::updateVoucher() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.marketing.vouchers.update' });
    if (gate.response) return gate.response;

    const { marketingVoucher: id } = await params;
    const voucher = await prisma.marketingVoucher.findUnique({ where: { id: BigInt(id) } });
    assertOwned(voucher, gate.clientId);

    const validated = await validate(await readBody(request), voucherRules());
    const data = await normalizeVoucher(validated, gate.clientId, voucher.id);

    await prisma.marketingVoucher.update({
        where: { id: voucher.id },
        data: { ...data, updated_at: new Date() },
    });

    return redirectTo('/app/marketing/vouchers', { success: 'Voucher updated.' });
});

/** DELETE /app/marketing/vouchers/{marketingVoucher} — ::destroyVoucher() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.marketing.vouchers.destroy' });
    if (gate.response) return gate.response;

    const { marketingVoucher: id } = await params;
    const voucher = await prisma.marketingVoucher.findUnique({ where: { id: BigInt(id) } });
    assertOwned(voucher, gate.clientId);

    await prisma.marketingVoucher.delete({ where: { id: voucher.id } });
    return redirectTo('/app/marketing/vouchers', { success: 'Voucher deleted.' });
});
