import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';

/** POST /app/messaging/whatsapp/templates */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.messaging.whatsapp.templates.store' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'messaging');
    if (gated) return gated;

    const data = await validate(await readBody(request), {
        whatsapp_account_id: ['nullable', 'integer'],
        name: ['required', 'string', 'max:255'],
        language: ['required', 'string', 'max:16'],
        category: ['nullable', 'string', 'max:32'],
        body: ['nullable', 'string'],
    });

    const client_id = BigInt(gate.clientId);

    if (data.whatsapp_account_id) {
        const account = await prisma.whatsAppAccount.findFirst({
            where: { id: BigInt(data.whatsapp_account_id), client_id },
        });
        if (!account) {
            return validationError({ whatsapp_account_id: ['The selected account is invalid.'] });
        }
    }

    await prisma.whatsAppTemplate.create({
        data: {
            client_id,
            whatsapp_account_id: data.whatsapp_account_id ? BigInt(data.whatsapp_account_id) : null,
            name: data.name,
            language: data.language,
            category: data.category ?? null,
            components: { body: data.body ?? '' },
            status: 'approved',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Template saved.' });
});
