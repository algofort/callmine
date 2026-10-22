import AdminCurrencies from '@/views/Admin/Currencies/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { defaultCurrencyCode } from '@/lib/services/currency';

export const dynamic = 'force-dynamic';

/** GET /admin/currencies */
export default async function Page() {
    await requireAdminPermissions('view_currencies');

    const [currencies, total, active, defaultCode] = await Promise.all([
        prisma.currency.findMany({ orderBy: { code: 'asc' } }),
        prisma.currency.count(),
        prisma.currency.count({ where: { enabled: true } }),
        defaultCurrencyCode(),
    ]);

    const props = {
        currencies: plain(currencies),
        stats: [
            { label: 'Total Currencies', value: total, icon: 'coins', accent: 'brand' },
            { label: 'Active', value: active, icon: 'check', accent: 'signal' },
            { label: 'Default', value: defaultCode ?? '—', icon: 'dollar', accent: 'warm' },
        ],
    };

    return renderPage(AdminCurrencies, 'Admin/Currencies/Index', props, {
        url: '/admin/currencies',
        isAdminRoute: true,
    });
}
