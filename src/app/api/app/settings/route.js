import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { putSession } from '@/lib/auth/session';

/** PUT /app/settings */
export const PUT = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.settings.update' });
    if (gate.response) return gate.response;

    const [locales, currencies] = await Promise.all([
        prisma.locale.findMany({ where: { enabled: true }, select: { code: true } }),
        prisma.currency.findMany({ where: { enabled: true }, select: { code: true } }),
    ]);
    const localeCodes = locales.map((l) => l.code);
    const currencyCodes = currencies.map((c) => c.code);

    const body = await readBody(request);
    const data = await validate(body, {
        locale: ['nullable', 'string', 'max:16', `in:${(localeCodes.length ? localeCodes : ['en']).join(',')}`],
        display_currency: [
            'nullable', 'string', 'max:10',
            `in:${(currencyCodes.length ? currencyCodes : ['USD']).join(',')}`,
        ],
        theme: ['nullable', 'string', 'in:light,dark'],
        client_name: ['nullable', 'string', 'max:255'],
        client_email: ['nullable', 'email', 'max:255'],
        client_phone: ['nullable', 'string', 'max:64'],
        client_address: ['nullable', 'string'],
    });

    const patch = {};
    if (data.locale) patch.locale = data.locale;
    if (data.display_currency) patch.display_currency = data.display_currency;
    if (data.theme) patch.theme = data.theme;

    if (Object.keys(patch).length) {
        await prisma.user.update({
            where: { id: gate.user.id },
            data: { ...patch, updated_at: new Date() },
        });
        // Keep the session bag in step so shared props pick the change up immediately.
        await putSession({ locale: patch.locale ?? gate.user.locale, theme: patch.theme ?? gate.user.theme });
    }

    if (gate.user.client_id && gate.user.client_role === 'administrator') {
        const clientPatch = {};
        if ('client_name' in body && data.client_name) clientPatch.name = data.client_name;
        if ('client_email' in body) clientPatch.email = data.client_email ?? null;
        if ('client_phone' in body) clientPatch.phone = data.client_phone ?? null;
        if ('client_address' in body) clientPatch.address = data.client_address ?? null;

        if (Object.keys(clientPatch).length) {
            await prisma.client.update({
                where: { id: gate.user.client_id },
                data: { ...clientPatch, updated_at: new Date() },
            });
        }
    }

    return redirectTo('/app/settings', { success: 'Settings saved.' });
});
