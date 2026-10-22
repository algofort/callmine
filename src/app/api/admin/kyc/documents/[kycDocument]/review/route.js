import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate } from '@/lib/http';
import { KYC_TYPES } from '@/lib/domain/kyc';

/** POST /admin/kyc/documents/{kycDocument}/review — ::reviewDocument() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.kyc.review', 'update_clients');
    if (gate.response) return gate.response;

    const { kycDocument: id } = await params;
    const doc = await prisma.kycDocument.findUnique({ where: { id: BigInt(id) } });
    if (!doc) return abort(404);

    const data = await validate(await readBody(request), {
        status: ['required', 'in:approved,rejected'],
        note: ['nullable', 'string', 'max:255'],
    });

    await prisma.kycDocument.update({
        where: { id: doc.id },
        data: {
            status: data.status,
            note: data.note ?? null,
            reviewed_by_admin_id: gate.admin.id,
            updated_at: new Date(),
        },
    });

    await syncClientStatus(doc.client_id);

    return back({ success: 'Document reviewed.' });
});

/**
 * — any rejection rejects the customer;
 * every required type approved verifies them; otherwise they stay pending.
 */
async function syncClientStatus(clientId) {
    const docs = await prisma.kycDocument.findMany({ where: { client_id: clientId } });

    let status = 'pending';
    if (docs.some((d) => d.status === 'rejected')) {
        status = 'rejected';
    } else if (
        Object.keys(KYC_TYPES).every((t) => docs.find((d) => d.type === t)?.status === 'approved')
    ) {
        status = 'verified';
    }

    await prisma.client.update({
        where: { id: clientId },
        data: { kyc_status: status, updated_at: new Date() },
    });
}
