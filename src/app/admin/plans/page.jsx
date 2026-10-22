import AdminPlans from '@/views/Admin/Plans/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { planToArray } from '@/lib/domain/admin-plans';

export const dynamic = 'force-dynamic';

/** GET /admin/plans (permission:view_plans). */
export default async function Page() {
    await requireAdminPermissions('view_plans');

    const rows = await prisma.plan.findMany({ orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] });

    const [total, active, subscribers] = await Promise.all([
        prisma.plan.count(),
        prisma.plan.count({ where: { enabled: true } }),
        prisma.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
    ]);

    const props = {
        plans: rows.map(planToArray),
        stats: [
            { label: 'Total plans', value: String(total), icon: 'layers', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'check', accent: 'signal' },
            {
                label: 'Subscribers',
                value: String(subscribers),
                icon: 'users',
                accent: 'warm',
                hint: 'Active subscriptions',
            },
        ],
    };

    return renderPage(AdminPlans, 'Admin/Plans/Index', props, {
        url: '/admin/plans',
        isAdminRoute: true,
    });
}
