import 'server-only';

import prisma from '@/lib/prisma';

/** GoogleSheetConnection::firstOrCreate(['client_id' => …]) */
export async function firstOrCreateSheetConnection(clientId) {
    const client_id = BigInt(clientId);
    const existing = await prisma.googleSheetConnection.findUnique({ where: { client_id } });
    if (existing) return existing;

    return prisma.googleSheetConnection.create({
        data: { client_id, created_at: new Date(), updated_at: new Date() },
    });
}
