import ApiKeysIndex from '@/views/client/ApiKeys/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage, requirePlanFeaturePage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { planFor } from '@/lib/plans';
import { SCOPES, isRevoked } from '@/lib/domain/api-keys';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/api-keys (plan.feature:api). */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    await requirePlanFeaturePage(user, 'api');

    const client_id = BigInt(clientId);
    const plan = await planFor(clientId);

    const rows = await prisma.apiKey.findMany({ where: { client_id }, orderBy: { id: 'desc' } });

    const [total, active, revoked, auditLog] = await Promise.all([
        prisma.apiKey.count({ where: { client_id } }),
        prisma.apiKey.count({ where: { client_id, revoked_at: null } }),
        prisma.apiKey.count({ where: { client_id, revoked_at: { not: null } } }),
        prisma.apiAuditLog.findMany({
            where: { client_id },
            orderBy: { id: 'desc' },
            take: 25,
            select: {
                method: true, path: true, status_code: true,
                ip: true, duration_ms: true, created_at: true,
            },
        }),
    ]);

    const props = {
        keys: rows.map((k) => ({
            id: Number(k.id),
            name: k.name,
            prefix: k.prefix,
            scopes: k.scopes,
            ip_whitelist: k.ip_whitelist,
            rate_limit_per_min: k.rate_limit_per_min,
            last_used_at: iso(k.last_used_at),
            revoked: isRevoked(k),
            created_at: iso(k.created_at),
        })),
        stats: [
            { label: 'Total keys', value: String(total), icon: 'key', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'check', accent: 'signal' },
            { label: 'Revoked', value: String(revoked), icon: 'lock', accent: 'danger' },
        ],
        availableScopes: SCOPES,
        limit: Number(plan?.api_keys_limit ?? 0),
        defaultRateLimit: Number(plan?.api_rate_limit_per_min ?? 100),
        auditLog: plain(auditLog),
        newKey: null,
    };

    return renderPage(ApiKeysIndex, 'client/ApiKeys/Index', props, { url: '/app/api-keys' });
}
