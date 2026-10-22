import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { redirectTo } from '@/lib/http';

/** POST /admin/smtp-configurations/{smtpConfiguration}/activate — ::activateSmtp() */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.smtp-configurations.activate', 'manage_email_settings');
    if (gate.response) return gate.response;

    const { smtpConfiguration: id } = await params;

    await prisma.smtpConfiguration.updateMany({ data: { is_active: false, updated_at: new Date() } });
    await prisma.smtpConfiguration
        .update({ where: { id: BigInt(id) }, data: { is_active: true, updated_at: new Date() } })
        .catch(() => {});

    return redirectTo('/admin/email-system', { success: 'SMTP configuration activated.' });
});
