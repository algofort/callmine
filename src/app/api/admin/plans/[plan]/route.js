import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate, validationError } from '@/lib/http';
import { planAttributes, planRules, slugify } from '@/lib/domain/admin-plans';

/** PUT /admin/plans/{plan} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.plans.update', 'update_plans');
    if (gate.response) return gate.response;

    const { plan: id } = await params;
    const plan = await prisma.plan.findUnique({ where: { id: BigInt(id) } });
    if (!plan) return abort(404);

    const data = await validate(await readBody(request), planRules());
    const slug = data.slug || slugify(data.name);

    const clash = await prisma.plan.findFirst({ where: { slug, id: { not: plan.id } } });
    if (clash) return validationError({ slug: ['The slug has already been taken.'] });

    await prisma.plan.update({
        where: { id: plan.id },
        data: { ...planAttributes({ ...data, slug }), updated_at: new Date() },
    });

    return redirectTo('/admin/plans', { success: 'Plan updated successfully.' });
});

/** DELETE /admin/plans/{plan} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.plans.destroy', 'delete_plans');
    if (gate.response) return gate.response;

    const { plan: id } = await params;
    await prisma.plan.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return redirectTo('/admin/plans', { success: 'Plan deleted successfully.' });
});
