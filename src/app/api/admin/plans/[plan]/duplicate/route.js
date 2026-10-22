import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort } from '@/lib/http';
import { nextSortOrder } from '@/lib/domain/admin-plans';
import { randomKeySuffix } from '@/lib/services/client-rbac';

/** POST /admin/plans/{plan}/duplicate */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.plans.duplicate', 'create_plans');
    if (gate.response) return gate.response;

    const { plan: id } = await params;
    const plan = await prisma.plan.findUnique({ where: { id: BigInt(id) } });
    if (!plan) return abort(404);

    // $plan->replicate() — everything but the key and timestamps.
    const { id: _id, created_at, updated_at, ...rest } = plan;

    const copy = await prisma.plan.create({
        data: {
            ...rest,
            name: `${plan.name} (Copy)`,
            slug: `${plan.slug}-copy-${randomKeySuffix(4).toLowerCase()}`,
            sort_order: await nextSortOrder(),
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // `openEditPlanId` opens the copy's editor on arrival.
    return NextResponse.json({
        redirect: '/admin/plans',
        flash: { success: 'Plan duplicated successfully.', openEditPlanId: Number(copy.id) },
    });
});
