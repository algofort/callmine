import 'server-only';

import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { maybeDecrypt } from '@/lib/crypt';

/**
 * Transactional email delivery over the SMTP account configured in the admin
 * panel (Admin → Email System). Templates and their placeholders are editable
 * from the same screen; see Customization → Email templates in the docs.
 */

export async function activeSmtp() {
    try {
        return await prisma.smtpConfiguration.findFirst({ where: { is_active: true } });
    } catch {
        return null;
    }
}

function replacePlaceholders(text, replacements) {
    let out = String(text ?? '');
    for (const [key, value] of Object.entries(replacements ?? {})) {
        out = out.replaceAll(`{{${key}}}`, String(value ?? ''));
    }
    return out;
}

function transportFor(smtp) {
    const encryption = ['none', 'null', '', null, undefined].includes(smtp.encryption)
        ? null
        : smtp.encryption;

    // Certificates are validated by default. Only a self-signed mail server
    // needs MAIL_ALLOW_SELF_SIGNED=true, and turning it on exposes the SMTP
    // session to interception — leave it off in production.
    const allowSelfSigned = String(process.env.MAIL_ALLOW_SELF_SIGNED ?? '').toLowerCase() === 'true';

    return nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port),
        secure: encryption === 'ssl' || Number(smtp.port) === 465,
        requireTLS: encryption === 'tls',
        auth: smtp.username ? { user: smtp.username, pass: maybeDecrypt(smtp.password) } : undefined,
        tls: { rejectUnauthorized: !allowSelfSigned },
    });
}

/** A structured From, so a name containing quotes cannot break the header. */
function fromAddress(smtp) {
    return smtp.from_name
        ? { name: String(smtp.from_name), address: String(smtp.from_email) }
        : String(smtp.from_email);
}

export async function sendRaw(smtp, to, subject, bodyHtml) {
    const transport = transportFor(smtp);
    await transport.sendMail({
        from: fromAddress(smtp),
        to,
        subject,
        html: bodyHtml,
    });
    return true;
}

export async function sendTemplateMail(templateKey, to, replacements = {}) {
    const smtp = await activeSmtp();
    if (!smtp) {
        console.warn('[mail] no active SMTP configuration; email not sent', { to, template: templateKey });
        return false;
    }

    const template = await prisma.template.findFirst({
        where: { type: 'email', slug: templateKey, enabled: true },
    });
    if (!template) {
        console.warn('[mail] template not found or disabled', { key: templateKey });
        return false;
    }

    const subject = replacePlaceholders(template.subject ?? template.name, replacements);
    const body = replacePlaceholders(template.content ?? '', replacements);

    try {
        return await sendRaw(smtp, to, subject, body);
    } catch (e) {
        console.error('[mail] send failed', { to, error: e?.message });
        return false;
    }
}
