import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate } from '@/lib/http';
import { encryptString } from '@/lib/crypt';

/** PUT /admin/smtp-configurations/{smtpConfiguration} — ::updateSmtp() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.smtp-configurations.update', 'manage_email_settings');
    if (gate.response) return gate.response;

    const { smtpConfiguration: id } = await params;
    const config = await prisma.smtpConfiguration.findUnique({ where: { id: BigInt(id) } });
    if (!config) return abort(404);

    const data = await validate(await readBody(request), {
        host: ['required', 'string', 'max:255'],
        port: ['required', 'integer', 'min:1', 'max:65535'],
        username: ['required', 'string', 'max:255'],
        password: ['nullable', 'string', 'max:255'],
        encryption: ['required', 'string', 'in:tls,ssl,none'],
        from_email: ['required', 'email'],
        from_name: ['required', 'string', 'max:255'],
        activate: ['nullable', 'boolean'],
    });

    if (data.activate) {
        await prisma.smtpConfiguration.updateMany({
            where: { id: { not: config.id } },
            data: { is_active: false, updated_at: new Date() },
        });
    }

    await prisma.smtpConfiguration.update({
        where: { id: config.id },
        data: {
            host: data.host,
            port: data.port,
            username: data.username,
            encryption: data.encryption,
            from_email: data.from_email,
            from_name: data.from_name,
            is_active: data.activate ?? config.is_active,
            // Blank means "keep the stored password".
            ...(data.password ? { password: encryptString(data.password) } : {}),
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/email-system', { success: 'SMTP configuration updated.' });
});

/** DELETE /admin/smtp-configurations/{smtpConfiguration} — ::destroySmtp() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.smtp-configurations.destroy', 'manage_email_settings');
    if (gate.response) return gate.response;

    const { smtpConfiguration: id } = await params;
    await prisma.smtpConfiguration.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return redirectTo('/admin/email-system', { success: 'SMTP configuration removed.' });
});
