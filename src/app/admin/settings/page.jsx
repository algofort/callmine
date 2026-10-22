import AdminSettings from '@/views/Admin/Settings/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /admin/settings */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const rows = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });

    // A secret's value is never echoed back — only whether one is stored.
    const settings = rows.map((s) => ({
        id: Number(s.id),
        key: s.key,
        value: s.is_secret ? (s.value ? '••••••••' : '') : (s.value ?? ''),
        is_secret: s.is_secret,
        group: s.group,
    }));

    const settingsByGroup = {};
    for (const s of settings) (settingsByGroup[s.group ?? ''] ??= []).push(s);

    return renderPage(AdminSettings, 'Admin/Settings/Index', { settingsByGroup }, {
        url: '/admin/settings',
        isAdminRoute: true,
    });
}
