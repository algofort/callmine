import AdminCreditPackages from '@/views/Admin/CreditPackages/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /admin/credit-packages */
export default async function Page() {
    await requireAdminPermissions('view_plans');

    const [packages, purchases, total, active] = await Promise.all([
        prisma.creditPackage.findMany({ orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] }),
        prisma.creditPurchase.findMany({
            where: { status: 'pending' },
            include: {
                clients: { select: { id: true, name: true, email: true } },
                credit_packages: { select: { id: true, name: true } },
            },
            orderBy: { id: 'desc' },
            take: 50,
        }),
        prisma.creditPackage.count(),
        prisma.creditPackage.count({ where: { is_active: true } }),
    ]);

    const props = {
        packages: plain(packages),
        pendingPurchases: purchases.map((p) => ({
            id: Number(p.id),
            client: p.clients?.name ?? p.clients?.email ?? '—',
            package: p.credit_packages?.name ?? null,
            credits: p.credits,
            amount_cents: Number(p.amount_cents),
            currency_code: p.currency_code,
            created_at: iso(p.created_at),
        })),
        stats: [
            { label: 'Total Packages', value: total, icon: 'layers', accent: 'brand' },
            { label: 'Active', value: active, icon: 'check', accent: 'signal' },
        ],
    };

    return renderPage(AdminCreditPackages, 'Admin/CreditPackages/Index', props, {
        url: '/admin/credit-packages',
        isAdminRoute: true,
    });
}
