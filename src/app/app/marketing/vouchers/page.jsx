import { notFound } from 'next/navigation';
import Vouchers from '@/views/client/Marketing/Vouchers';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { VOUCHER_STATUS, voucherToArray } from '@/lib/domain/marketing';

export const dynamic = 'force-dynamic';

/** GET /app/marketing/vouchers */
export default async function Page() {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const client_id = BigInt(clientId);

    const [rows, total, active, sums] = await Promise.all([
        prisma.marketingVoucher.findMany({ where: { client_id }, orderBy: { id: 'desc' } }),
        prisma.marketingVoucher.count({ where: { client_id } }),
        prisma.marketingVoucher.count({ where: { client_id, status: VOUCHER_STATUS.ACTIVE } }),
        prisma.marketingVoucher.aggregate({
            where: { client_id },
            _sum: { usage_count: true, total_discount_amount: true },
        }),
    ]);

    const props = {
        stats: {
            total_vouchers: total,
            active_vouchers: active,
            total_usage: Number(sums._sum.usage_count ?? 0),
            total_discount_given: Number(sums._sum.total_discount_amount ?? 0),
        },
        vouchers: rows.map(voucherToArray),
    };

    return renderPage(Vouchers, 'client/Marketing/Vouchers', props, { url: '/app/marketing/vouchers' });
}
