import SettingsIndex from '@/views/client/Settings/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/settings */
export default async function Page() {
    const { user } = await requireClientPage();

    let supportedLocales = await prisma.locale.findMany({
        where: { enabled: true },
        orderBy: [{ is_default: 'desc' }, { sort_order: 'asc' }],
        select: { code: true, name: true },
    });
    if (!supportedLocales.length) supportedLocales = [{ code: 'en', name: 'English' }];

    const supportedCurrencies = await prisma.currency.findMany({
        where: { enabled: true },
        orderBy: { code: 'asc' },
        select: { code: true, symbol: true },
    });

    let client = null;
    if (user.client_id && user.client_role === 'administrator' && user.clients) {
        const c = user.clients;
        client = plain({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address });
    }

    const props = {
        preferences: {
            locale: user.locale ?? config.app.locale,
            display_currency: user.display_currency ?? 'USD',
            theme: user.theme ?? 'light',
        },
        supportedLocales: supportedLocales.map((l) => ({ code: l.code, name: l.name })),
        supportedCurrencies: supportedCurrencies.map((c) => ({
            code: c.code,
            name: c.code,
            symbol: c.symbol ?? c.code,
        })),
        client,
    };

    return renderPage(SettingsIndex, 'client/Settings/Index', props, { url: '/app/settings' });
}
