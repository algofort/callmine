import { notFound } from 'next/navigation';
import GiftCards from '@/views/client/Marketing/GiftCards';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { GIFT_CARD_STATUS, GIFT_DELIVERY, giftCardToArray } from '@/lib/domain/marketing';

export const dynamic = 'force-dynamic';

/** GET /app/marketing/gift-cards */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const params = await searchParams;
    const client_id = BigInt(clientId);

    const where = { client_id };
    if (params?.search) {
        const s = String(params.search);
        where.OR = [
            { code: { contains: s } },
            { recipient_name: { contains: s } },
            { recipient_email: { contains: s } },
        ];
    }
    if (params?.status) where.status = String(params.status);

    const giftCards = await paginate(prisma.marketingGiftCard, {
        where,
        orderBy: { id: 'desc' },
        perPage: 10,
        page: params?.page ?? 1,
        path: '/app/marketing/gift-cards',
        query: { search: params?.search, status: params?.status },
        transform: giftCardToArray,
    });

    const [total, active, sums, pending, all] = await Promise.all([
        prisma.marketingGiftCard.count({ where: { client_id } }),
        prisma.marketingGiftCard.count({ where: { client_id, status: GIFT_CARD_STATUS.ACTIVE } }),
        prisma.marketingGiftCard.aggregate({ where: { client_id }, _sum: { initial_amount: true } }),
        prisma.marketingGiftCard.count({
            where: { client_id, delivery_status: GIFT_DELIVERY.PENDING },
        }),
        prisma.marketingGiftCard.findMany({
            where: { client_id },
            select: { initial_amount: true, balance: true },
        }),
    ]);

    // redeemed = sum(max(0, initial - balance))
    const redeemed = all.reduce(
        (sum, g) => sum + Math.max(0, Number(g.initial_amount) - Number(g.balance)),
        0,
    );

    const props = {
        stats: {
            total_cards: total,
            active_cards: active,
            total_value: Number(sums._sum.initial_amount ?? 0),
            redeemed,
            pending_delivery: pending,
        },
        giftCards,
        filters: {
            search: params?.search ?? '',
            status: params?.status ?? '',
        },
    };

    return renderPage(GiftCards, 'client/Marketing/GiftCards', props, {
        url: '/app/marketing/gift-cards',
    });
}
