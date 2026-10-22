import { notFound } from 'next/navigation';
import PlanEdit from '@/views/Admin/Plans/Edit';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { planToArray } from '@/lib/domain/admin-plans';

export const dynamic = 'force-dynamic';

/** GET /admin/plans/{plan}/edit */
export default async function Page({ params }) {
    await requireAdminPermissions('update_plans');

    const { plan: id } = await params;
    const plan = await prisma.plan.findUnique({ where: { id: BigInt(id) } });
    if (!plan) notFound();

    return renderPage(PlanEdit, 'Admin/Plans/Edit', { plan: planToArray(plan) }, {
        url: `/admin/plans/${id}/edit`,
        isAdminRoute: true,
    });
}
