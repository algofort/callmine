import KnowledgeBaseIndex from '@/views/client/KnowledgeBase/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { limitFor } from '@/lib/plans';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/knowledge-base */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    const items = await paginate(prisma.knowledgeBaseItem, {
        where: { client_id },
        orderBy: { id: 'desc' },
        perPage: 20,
        page: params?.page ?? 1,
        path: '/app/knowledge-base',
        transform: (i) => ({
            id: Number(i.id),
            title: i.title,
            type: i.type,
            status: i.status,
            source_url: i.source_url,
            size_kb: Math.round(Number(i.file_size_bytes ?? 0) / 1024),
            created_at: iso(i.created_at),
        }),
    });

    const [usedAgg, total, ready, failed, limitMb] = await Promise.all([
        prisma.knowledgeBaseItem.aggregate({ where: { client_id }, _sum: { file_size_bytes: true } }),
        prisma.knowledgeBaseItem.count({ where: { client_id } }),
        prisma.knowledgeBaseItem.count({ where: { client_id, status: 'ready' } }),
        prisma.knowledgeBaseItem.count({ where: { client_id, status: 'failed' } }),
        limitFor(clientId, 'kb_mb'),
    ]);

    const usedBytes = Number(usedAgg._sum.file_size_bytes ?? 0);

    const props = {
        items,
        stats: [
            { label: 'Total items', value: String(total), icon: 'book', accent: 'brand' },
            { label: 'Ready', value: String(ready), icon: 'check', accent: 'signal' },
            { label: 'Failed', value: String(failed), icon: 'lock', accent: 'danger' },
            {
                label: 'Storage used',
                value: `${Math.round((usedBytes / 1048576) * 100) / 100} MB`,
                icon: 'database',
                accent: 'cold',
            },
        ],
        storage: {
            used_mb: Math.round((usedBytes / 1048576) * 100) / 100,
            limit_mb: limitMb ?? 0,
        },
    };

    return renderPage(KnowledgeBaseIndex, 'client/KnowledgeBase/Index', props, {
        url: '/app/knowledge-base',
    });
}
