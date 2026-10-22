import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';

/** PUT /admin/currencies/{currency} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.currencies.update', 'manage_currencies');
    if (gate.response) return gate.response;

    // The currencies table is keyed by code, not id.
    const { currency: code } = await params;
    const currency = await prisma.currency.findUnique({ where: { code } });
    if (!currency) return abort(404);

    const data = await validate(await readBody(request), {
        symbol: ['required', 'string', 'max:16'],
        decimals: ['nullable', 'integer', 'min:0', 'max:6'],
        exchange_rate: ['nullable', 'numeric', 'min:0'],
        is_default: ['nullable', 'boolean'],
        enabled: ['nullable', 'boolean'],
    });

    // Exactly one default currency.
    if (data.is_default) {
        await prisma.currency.updateMany({
            where: { code: { not: currency.code } },
            data: { is_default: false, updated_at: new Date() },
        });
    }

    await prisma.currency.update({
        where: { code: currency.code },
        data: {
            symbol: data.symbol,
            ...(data.decimals !== undefined && data.decimals !== null ? { decimals: data.decimals } : {}),
            ...(data.exchange_rate !== undefined && data.exchange_rate !== null
                ? { exchange_rate: Number(data.exchange_rate) }
                : {}),
            ...(data.is_default !== undefined && data.is_default !== null
                ? { is_default: data.is_default }
                : {}),
            ...(data.enabled !== undefined && data.enabled !== null ? { enabled: data.enabled } : {}),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Currency updated.' });
});
