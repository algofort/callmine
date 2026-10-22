import AdminEmailSystem from '@/views/Admin/EmailSystem/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /admin/email-system */
export default async function Page() {
    await requireAdminPermissions('view_email_settings');

    const [smtp, templates] = await Promise.all([
        prisma.smtpConfiguration.findMany({ orderBy: [{ is_active: 'desc' }, { id: 'asc' }] }),
        prisma.template.findMany({ where: { type: 'email' }, orderBy: { name: 'asc' } }),
    ]);

    const props = {
        smtpConfigurations: smtp.map((c) => ({
            id: Number(c.id),
            host: c.host,
            port: c.port,
            username: c.username,
            // The stored password is never sent to the browser.
            password: '',
            encryption: c.encryption,
            from_email: c.from_email,
            from_name: c.from_name,
            is_active: c.is_active,
            summary: `${c.host}:${c.port}`,
        })),
        emailTemplates: templates.map((t) => ({
            id: Number(t.id),
            name: t.name,
            slug: t.slug,
            subject: t.subject,
            content: t.content,
            enabled: t.enabled,
        })),
    };

    return renderPage(AdminEmailSystem, 'Admin/EmailSystem/Index', props, {
        url: '/admin/email-system',
        isAdminRoute: true,
    });
}
