import { notFound } from 'next/navigation';
import KycIndex from '@/views/client/Kyc/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { KYC_TYPES } from '@/lib/domain/kyc';

export const dynamic = 'force-dynamic';

/** GET /app/verification */
export default async function Page() {
    const { clientId } = await requireClientPage();
    if (!clientId) notFound();

    const client = await prisma.client.findUnique({ where: { id: BigInt(clientId) } });
    if (!client) notFound();

    const docs = await prisma.kycDocument.findMany({ where: { client_id: client.id } });
    const byType = Object.fromEntries(docs.map((d) => [d.type, d]));

    const props = {
        kycStatus: client.kyc_status,
        types: Object.entries(KYC_TYPES).map(([type, label]) => ({
            type,
            label,
            status: byType[type]?.status ?? null,
            note: byType[type]?.note ?? null,
            original_name: byType[type]?.original_name ?? null,
            uploaded: !!byType[type],
        })),
    };

    return renderPage(KycIndex, 'client/Kyc/Index', props, { url: '/app/verification' });
}
