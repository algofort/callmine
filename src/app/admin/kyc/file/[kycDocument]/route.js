import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { abort } from '@/lib/http';
import { readFile } from '@/lib/storage';

/**
 * GET /admin/kyc/file/{kycDocument}.
 * KYC uploads live on the private disk, so they are streamed, never linked.
 */
export const GET = handler(async (request, { params }) => {
    await requireAdminPermissions('view_clients');

    const { kycDocument: id } = await params;
    const doc = await prisma.kycDocument.findUnique({ where: { id: BigInt(id) } });
    if (!doc?.file_path) return abort(404);

    const body = await readFile(doc.file_path, 'local');
    if (!body) return abort(404);

    return new Response(body, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${doc.original_name ?? 'document'}"`,
            'Content-Length': String(body.length),
        },
    });
});
