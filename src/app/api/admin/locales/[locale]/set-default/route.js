import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back } from '@/lib/http';
import { clearDictionaryCache } from '@/lib/i18n-server';

/** POST /admin/locales/{locale}/set-default — ::setDefault() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.locales.set-default', 'manage_languages');
    if (gate.response) return gate.response;

    const { locale: code } = await params;
    const locale = await prisma.locale.findUnique({ where: { code } });
    if (!locale) return abort(404);

    if (!locale.enabled) return back({ error: 'Enable the locale first.' });

    await prisma.locale.updateMany({ where: { is_default: true }, data: { is_default: false } });
    await prisma.locale.update({ where: { code }, data: { is_default: true, updated_at: new Date() } });

    clearDictionaryCache();

    return back({ success: `${locale.name} is now the default language.` });
});
