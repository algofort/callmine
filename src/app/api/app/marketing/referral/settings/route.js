import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { REWARD_TYPE, firstOrCreateReferralSettings } from '@/lib/domain/marketing';

/** PUT /app/marketing/referral/settings — ::updateReferralSettings() */
export const PUT = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.marketing.referral.settings.update' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        enabled: ['required', 'boolean'],
        reward_type: ['required', 'string', `in:${REWARD_TYPE.PERCENTAGE},${REWARD_TYPE.FIXED}`],
        reward_value: ['required', 'numeric', 'min:0'],
        referred_user_discount: ['required', 'numeric', 'min:0', 'max:100'],
        min_order_amount: ['required', 'numeric', 'min:0'],
        expiry_days: ['required', 'integer', 'min:1', 'max:3650'],
        terms: ['nullable', 'string', 'max:10000'],
    });

    if (data.reward_type === REWARD_TYPE.PERCENTAGE && Number(data.reward_value) > 100) {
        return validationError({
            reward_value: ['Referrer reward percentage must be at most 100%.'],
        });
    }

    const settings = await firstOrCreateReferralSettings(gate.clientId);

    await prisma.marketingReferralSetting.update({
        where: { id: settings.id },
        data: {
            enabled: data.enabled,
            reward_type: data.reward_type,
            reward_value: Number(data.reward_value),
            referred_user_discount: Number(data.referred_user_discount),
            min_order_amount: Number(data.min_order_amount),
            expiry_days: Number(data.expiry_days),
            terms: data.terms || null,
            updated_at: new Date(),
        },
    });

    return redirectTo('/app/marketing/referral?tab=settings', { success: 'Referral settings saved.' });
});
