import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import {
    GIFT_CARD_STATUS,
    GIFT_DELIVERY,
    GIFT_THEMES,
    generateGiftCode,
} from '@/lib/domain/marketing';

/** POST /app/marketing/gift-cards/bulk-generate — ::bulkGenerateGiftCards() */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.marketing.gift-cards.bulk-generate' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        quantity: ['required', 'integer', 'min:1', 'max:100'],
        amount: ['required', 'numeric', 'min:0.01'],
        theme: ['nullable', 'string', `in:${GIFT_THEMES.join(',')}`],
    });

    const theme = data.theme || 'default';
    const qty = Number(data.quantity);
    const amount = Number(data.amount);
    const client_id = BigInt(gate.clientId);

    for (let i = 0; i < qty; i++) {
        await prisma.marketingGiftCard.create({
            data: {
                client_id,
                code: await generateGiftCode(gate.clientId),
                initial_amount: amount,
                balance: amount,
                recipient_name: null,
                recipient_email: null,
                personal_message: null,
                theme,
                expires_at: null,
                status: GIFT_CARD_STATUS.ACTIVE,
                delivery_status: GIFT_DELIVERY.PENDING,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    return redirectTo('/app/marketing/gift-cards', { success: `Generated ${qty} gift cards.` });
});
