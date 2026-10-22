import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate } from '@/lib/http';
import { deleteFile, storeFile } from '@/lib/storage';
import { KYC_STATUS, KYC_TYPES } from '@/lib/domain/kyc';

/** POST /app/verification */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.kyc.upload' });
    if (gate.response) return gate.response;
    if (!gate.clientId) return abort(404);

    const body = await readBody(request);
    const data = await validate(body, {
        type: ['required', `in:${Object.keys(KYC_TYPES).join(',')}`],
    });

    const file = body.file;
    if (!(file instanceof File)) return back({ error: 'A document file is required.' });
    if (file.size > 10240 * 1024) return back({ error: 'The file may not be greater than 10240 kilobytes.' });

    const ext = (file.name?.split('.').pop() ?? '').toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
        return back({ error: 'The file must be a file of type: pdf, jpg, jpeg, png.' });
    }

    const client_id = BigInt(gate.clientId);
    const existing = await prisma.kycDocument.findFirst({ where: { client_id, type: data.type } });
    if (existing?.file_path) await deleteFile(existing.file_path);

    const path = await storeFile(file, `kyc/${gate.clientId}`, 'local');

    const values = {
        file_path: path,
        original_name: file.name,
        status: KYC_STATUS.PENDING,
        note: null,
        reviewed_by_admin_id: null,
        updated_at: new Date(),
    };

    if (existing) {
        await prisma.kycDocument.update({ where: { id: existing.id }, data: values });
    } else {
        await prisma.kycDocument.create({
            data: { client_id, type: data.type, ...values, created_at: new Date() },
        });
    }

    const client = await prisma.client.findUnique({ where: { id: client_id } });
    if (['unverified', 'rejected'].includes(client.kyc_status)) {
        await prisma.client.update({
            where: { id: client_id },
            data: { kyc_status: 'pending', updated_at: new Date() },
        });
    }

    return back({ success: 'Document uploaded for review.' });
});
