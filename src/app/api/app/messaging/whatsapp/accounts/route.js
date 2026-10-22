import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';

/** POST /app/messaging/whatsapp/accounts */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.messaging.whatsapp.accounts.store' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'messaging');
    if (gated) return gated;

    const data = await validate(await readBody(request), {
        provider: ['required', 'in:meta,whatsway'],
        label: ['nullable', 'string', 'max:255'],
        display_number: ['nullable', 'string', 'max:32'],
        phone_number_id: ['nullable', 'string', 'max:255'],
        waba_id: ['nullable', 'string', 'max:255'],
        access_token: ['nullable', 'string'],
        api_key: ['nullable', 'string'],
        base_url: ['nullable', 'url'],
    });

    await prisma.whatsAppAccount.create({
        data: {
            client_id: BigInt(gate.clientId),
            provider: data.provider,
            label: data.label ?? null,
            display_number: data.display_number ?? null,
            phone_number_id: data.phone_number_id ?? null,
            waba_id: data.waba_id ?? null,
            access_token: data.access_token ?? null,
            api_key: data.api_key ?? null,
            base_url: data.base_url ?? null,
            status: 'connected',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'WhatsApp account connected.' });
});
