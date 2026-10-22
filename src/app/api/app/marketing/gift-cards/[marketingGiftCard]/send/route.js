import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { redirectTo } from '@/lib/http';
import { GIFT_DELIVERY } from '@/lib/domain/marketing';

/** POST /app/marketing/gift-cards/{marketingGiftCard}/send — ::sendGiftCard() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.marketing.gift-cards.send' });
    if (gate.response) return gate.response;

    const { marketingGiftCard: id } = await params;
    const card = await prisma.marketingGiftCard.findUnique({ where: { id: BigInt(id) } });
    assertOwned(card, gate.clientId);

    if (card.delivery_status === GIFT_DELIVERY.PENDING) {
        await prisma.marketingGiftCard.update({
            where: { id: card.id },
            data: { delivery_status: GIFT_DELIVERY.SENT, updated_at: new Date() },
        });
    }

    return redirectTo('/app/marketing/gift-cards', { success: 'Gift card marked as sent.' });
});
