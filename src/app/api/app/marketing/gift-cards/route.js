import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import {
    GIFT_DELIVERY,
    generateGiftCode,
    giftCardRules,
    normalizeGiftCard,
} from '@/lib/domain/marketing';

/** POST /app/marketing/gift-cards */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.marketing.gift-cards.store' });
    if (gate.response) return gate.response;

    const validated = await validate(await readBody(request), giftCardRules(true));
    const data = normalizeGiftCard(validated, true);

    await prisma.marketingGiftCard.create({
        data: {
            client_id: BigInt(gate.clientId),
            code: await generateGiftCode(gate.clientId),
            initial_amount: data.initial_amount,
            balance: data.initial_amount,
            recipient_name: data.recipient_name,
            recipient_email: data.recipient_email,
            personal_message: data.personal_message,
            theme: data.theme,
            expires_at: data.expires_at,
            status: data.status,
            delivery_status: GIFT_DELIVERY.PENDING,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/marketing/gift-cards', { success: 'Gift card created.' });
});
