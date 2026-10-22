import AdminKyc from '@/views/Admin/Kyc/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Pending first, then rejected, unverified, verified. */
const ORDER = { pending: 0, rejected: 1, unverified: 2, verified: 3 };

/** GET /admin/kyc */
export default async function Page() {
    await requireAdminPermissions('view_clients');

    const rows = await prisma.client.findMany({
        include: { _count: { select: { kyc_documents: true } } },
        orderBy: { name: 'asc' },
    });

    const clients = rows
        .map((c) => ({
            id: Number(c.id),
            name: c.name,
            email: c.email,
            kyc_status: c.kyc_status,
            documents: c._count.kyc_documents,
        }))
        .sort(
            (a, b) =>
                (ORDER[a.kyc_status] ?? 9) - (ORDER[b.kyc_status] ?? 9) || a.name.localeCompare(b.name),
        );

    return renderPage(AdminKyc, 'Admin/Kyc/Index', { clients }, {
        url: '/admin/kyc',
        isAdminRoute: true,
    });
}
