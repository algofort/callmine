import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { nextSortOrder, planAttributes, planRules, slugify } from '@/lib/domain/admin-plans';

/** POST /admin/plans */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.plans.store', 'create_plans');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), planRules());
    const slug = data.slug || slugify(data.name);

    if (await prisma.plan.findUnique({ where: { slug } })) {
        return validationError({ slug: ['The slug has already been taken.'] });
    }

    await prisma.plan.create({
        data: {
            ...planAttributes({ ...data, slug }),
            sort_order: await nextSortOrder(),
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/plans', { success: 'Plan created successfully.' });
});
