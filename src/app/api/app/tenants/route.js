import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate } from '@/lib/http';
import { putSession } from '@/lib/auth/session';

/** POST /app/tenants */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.tenants.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
    });

    const tenant = await prisma.tenant.create({
        data: {
            name: data.name,
            owner_id: gate.user.id,
            default_locale: gate.user.locale ?? 'en',
            currency_code: gate.user.display_currency,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await prisma.tenantUser.create({
        data: {
            tenant_id: tenant.id,
            user_id: gate.user.id,
            role: 'owner',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await putSession({ current_tenant_id: Number(tenant.id) });
    await prisma.user.update({
        where: { id: gate.user.id },
        data: { tenant_id: tenant.id, updated_at: new Date() },
    });

    return redirectTo('/app/tenants', { success: 'Workspace created.' });
});
