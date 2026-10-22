import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';

/** POST /admin/kyc/{client}/status */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.kyc.status', 'update_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;

    const data = await validate(await readBody(request), {
        kyc_status: ['required', 'in:unverified,pending,verified,rejected'],
    });

    await prisma.client
        .update({
            where: { id: BigInt(id) },
            data: { kyc_status: data.kyc_status, updated_at: new Date() },
        })
        .catch(() => {});

    return back({ success: 'Verification status updated.' });
});
