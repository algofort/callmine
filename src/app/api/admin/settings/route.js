import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';

/** PUT /admin/settings */
export const PUT = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.settings.update', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), { settings: ['required', 'array'] });

    for (const s of data.settings ?? []) {
        if (!s?.key) continue;

        const isSecret = !!s.is_secret;
        const value = s.value ?? null;

        // A masked secret means "unchanged" — never overwrite with the bullets.
        const keepExisting = value !== null && value !== '' && isSecret && /^•+$/.test(String(value));

        const existing = await prisma.systemSetting.findFirst({ where: { key: s.key } });

        const patch = {
            is_secret: isSecret,
            group: s.group ?? null,
            updated_at: new Date(),
            ...(value !== null && value !== '' && !keepExisting ? { value: String(value) } : {}),
        };

        if (existing) {
            await prisma.systemSetting.update({ where: { id: existing.id }, data: patch });
        } else {
            await prisma.systemSetting.create({
                data: { key: s.key, value: keepExisting ? null : value, ...patch, created_at: new Date() },
            });
        }
    }

    return back({ success: 'Settings saved.' });
});
