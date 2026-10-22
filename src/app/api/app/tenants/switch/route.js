import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, readBody, redirectTo, validate } from '@/lib/http';
import { tenantAccessibleBy } from '@/lib/auth';
import { putSession } from '@/lib/auth/session';

/** POST /app/tenants/switch */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.tenants.switch' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), { tenant_id: ['required', 'integer'] });

    const tenant = await prisma.tenant.findUnique({ where: { id: BigInt(data.tenant_id) } });
    if (!tenant) return abort(404);

    if (!(await tenantAccessibleBy(tenant, gate.user))) return abort(403);

    await putSession({ current_tenant_id: Number(tenant.id) });
    await prisma.user.update({
        where: { id: gate.user.id },
        data: { tenant_id: tenant.id, updated_at: new Date() },
    });

    return redirectTo('/app/dashboard');
});
