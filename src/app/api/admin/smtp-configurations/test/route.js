import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, validate } from '@/lib/http';
import { activeSmtp, sendRaw } from '@/lib/services/mail';

/** POST /admin/smtp-configurations/test */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.smtp-configurations.test', 'manage_email_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), { email: ['required', 'email'] });

    const smtp = await activeSmtp();
    if (!smtp) {
        return NextResponse.json(
            { message: 'No active SMTP configuration. Please activate one first.' },
            { status: 422 },
        );
    }

    try {
        await sendRaw(
            smtp,
            data.email,
            `Test email from ${config.app.name}`,
            '<p>This is a test email. Your SMTP configuration is working.</p>',
        );
        return NextResponse.json({ message: 'Test email sent successfully.' });
    } catch (e) {
        return NextResponse.json({ message: e?.message ?? 'Send failed.' }, { status: 500 });
    }
});
