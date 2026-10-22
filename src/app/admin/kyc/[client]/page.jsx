import { notFound } from 'next/navigation';
import AdminKycShow from '@/views/Admin/Kyc/Show';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';
import { KYC_TYPES } from '@/lib/domain/kyc';

export const dynamic = 'force-dynamic';

/** GET /admin/kyc/{client} */
export default async function Page({ params }) {
    await requireAdminPermissions('view_clients');

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) notFound();

    const docs = await prisma.kycDocument.findMany({ where: { client_id: client.id } });

    const props = {
        client: {
            id: Number(client.id),
            name: client.name,
            email: client.email,
            kyc_status: client.kyc_status,
        },
        documents: docs.map((d) => ({
            id: Number(d.id),
            type: d.type,
            label: KYC_TYPES[d.type] ?? d.type,
            status: d.status,
            note: d.note,
            original_name: d.original_name,
            url: `/admin/kyc/file/${Number(d.id)}`,
            created_at: iso(d.created_at),
        })),
        types: KYC_TYPES,
    };

    return renderPage(AdminKycShow, 'Admin/Kyc/Show', props, {
        url: `/admin/kyc/${id}`,
        isAdminRoute: true,
    });
}
