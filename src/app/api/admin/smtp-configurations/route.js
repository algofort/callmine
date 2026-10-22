import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate } from '@/lib/http';
import { encryptString } from '@/lib/crypt';

/** POST /admin/smtp-configurations */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.smtp-configurations.store', 'manage_email_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        host: ['required', 'string', 'max:255'],
        port: ['required', 'integer', 'min:1', 'max:65535'],
        username: ['required', 'string', 'max:255'],
        password: ['required', 'string', 'max:255'],
        encryption: ['required', 'string', 'in:tls,ssl,none'],
        from_email: ['required', 'email'],
        from_name: ['required', 'string', 'max:255'],
        activate: ['nullable', 'boolean'],
    });

    // Exactly one active configuration at a time.
    if (data.activate) {
        await prisma.smtpConfiguration.updateMany({ data: { is_active: false, updated_at: new Date() } });
    }

    await prisma.smtpConfiguration.create({
        data: {
            host: data.host,
            port: data.port,
            username: data.username,
            // Encrypted at rest with APP_KEY — never stored in plain text.
            password: encryptString(data.password),
            encryption: data.encryption,
            from_email: data.from_email,
            from_name: data.from_name,
            is_active: data.activate ?? false,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/email-system', { success: 'SMTP configuration added.' });
});
