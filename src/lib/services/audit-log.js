import 'server-only';

import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import config from '@/lib/config';

/** Port of App\Services\AuditLogService. */

async function requestContext() {
    try {
        const h = await headers();
        return {
            ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '127.0.0.1',
            user_agent: h.get('user-agent') ?? null,
            url: h.get('referer') ?? config.app.url,
        };
    } catch {
        return { ip: null, user_agent: null, url: null };
    }
}

/** — customer-side action. */
export async function logAudit(user, action, { auditableType = null, auditableId = null, oldValues = null, newValues = null } = {}) {
    const ctx = await requestContext();

    return prisma.auditLog
        .create({
            data: {
                user_id: user?.id ?? null,
                client_id: user?.client_id ?? null,
                action,
                auditable_type: auditableType,
                auditable_id: auditableId ? BigInt(auditableId) : null,
                old_values: oldValues,
                new_values: newValues,
                ...ctx,
                created_at: new Date(),
                updated_at: new Date(),
            },
        })
        .catch((e) => console.warn('[audit] write failed:', e?.message));
}

/** — admin-side action. */
export async function logAdminAudit(admin, action, targetType = null, targetId = null, meta = null) {
    const ctx = await requestContext();

    return prisma.auditLog
        .create({
            data: {
                actor_admin_id: admin?.id ?? null,
                action,
                auditable_type: targetType,
                auditable_id: targetId ? BigInt(targetId) : null,
                meta,
                ...ctx,
                created_at: new Date(),
                updated_at: new Date(),
            },
        })
        .catch((e) => console.warn('[audit] write failed:', e?.message));
}
