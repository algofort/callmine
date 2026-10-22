import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { messagingSettings } from '@/lib/services/messaging';

/** PUT /admin/messaging */
export const PUT = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.messaging.update', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        provider_mode: ['required', 'in:both,whatsway,meta,disabled'],
        meta_app_id: ['nullable', 'string', 'max:255'],
        meta_app_secret: ['nullable', 'string', 'max:255'],
        meta_config_id: ['nullable', 'string', 'max:255'],
        verify_token: ['nullable', 'string', 'max:255'],
        embedded_signup_enabled: ['nullable', 'boolean'],
        coexistence_enabled: ['nullable', 'boolean'],
    });

    const s = await messagingSettings();

    await prisma.messagingSetting.update({
        where: { id: s.id },
        data: {
            provider_mode: data.provider_mode,
            meta_app_id: data.meta_app_id ?? null,
            meta_config_id: data.meta_config_id ?? null,
            verify_token: data.verify_token ?? null,
            embedded_signup_enabled: data.embedded_signup_enabled ?? false,
            coexistence_enabled: data.coexistence_enabled ?? false,
            // Blank means "keep the stored app secret".
            ...(data.meta_app_secret ? { meta_app_secret: data.meta_app_secret } : {}),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Messaging settings saved.' });
});
