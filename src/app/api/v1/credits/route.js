import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { plain } from '@/lib/serialize';
import { balance } from '@/lib/services/credits';

/** GET /api/v1/credits */
export const GET = apiRoute('credits:read', async (request, { clientId }) => {
    const recent = await prisma.creditLedger.findMany({
        where: { client_id: clientId },
        orderBy: { id: 'desc' },
        take: 10,
        select: { delta: true, balance_after: true, reason: true, created_at: true },
    });

    return apiJson({ balance: await balance(clientId), recent: plain(recent) });
});
