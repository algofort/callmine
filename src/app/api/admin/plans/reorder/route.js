import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate } from '@/lib/http';

/** POST /admin/plans/reorder */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.plans.reorder', 'update_plans');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), { order: ['required', 'array'] });

    // Array position becomes sort_order.
    for (const [position, id] of (data.order ?? []).entries()) {
        await prisma.plan
            .update({ where: { id: BigInt(id) }, data: { sort_order: position, updated_at: new Date() } })
            .catch(() => {});
    }

    return redirectTo('/admin/plans', { success: 'Plans reordered.' });
});
