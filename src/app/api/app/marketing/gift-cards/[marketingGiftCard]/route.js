import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { giftCardRules, normalizeGiftCard } from '@/lib/domain/marketing';

/** PUT /app/marketing/gift-cards/{marketingGiftCard} — ::updateGiftCard() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.marketing.gift-cards.update' });
    if (gate.response) return gate.response;

    const { marketingGiftCard: id } = await params;
    const card = await prisma.marketingGiftCard.findUnique({ where: { id: BigInt(id) } });
    assertOwned(card, gate.clientId);

    const validated = await validate(await readBody(request), giftCardRules(false));
    const data = normalizeGiftCard(validated, false);

    // The amount is fixed at creation; only the recipient details change here.
    await prisma.marketingGiftCard.update({
        where: { id: card.id },
        data: {
            recipient_name: data.recipient_name,
            recipient_email: data.recipient_email,
            personal_message: data.personal_message,
            theme: data.theme,
            expires_at: data.expires_at,
            status: data.status,
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/marketing/gift-cards', { success: 'Gift card updated.' });
});
