import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, redirectTo, validate, validationError } from '@/lib/http';

/** PUT /admin/email-system/templates/{template} — ::updateTemplate() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.email-system.templates.update', 'manage_email_settings');
    if (gate.response) return gate.response;

    const { template: id } = await params;
    const template = await prisma.template.findUnique({ where: { id: BigInt(id) } });
    if (!template) return abort(404);

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        slug: ['nullable', 'string', 'max:128'],
        subject: ['nullable', 'string', 'max:255'],
        content: ['nullable', 'string'],
        enabled: ['nullable', 'boolean'],
    });

    // A blank slug keeps the existing one — the mailer looks templates up by slug.
    const slug = data.slug || template.slug;

    const clash = await prisma.template.findFirst({ where: { slug, id: { not: template.id } } });
    if (clash) return validationError({ slug: ['The slug has already been taken.'] });

    await prisma.template.update({
        where: { id: template.id },
        data: {
            name: data.name,
            slug,
            subject: data.subject ?? null,
            content: data.content ?? null,
            type: 'email',
            enabled: data.enabled ?? template.enabled,
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/email-system', { success: 'Email template updated.' });
});

/** DELETE /admin/email-system/templates/{template} — ::destroyTemplate() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.email-system.templates.destroy', 'manage_email_settings');
    if (gate.response) return gate.response;

    const { template: id } = await params;
    await prisma.template.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return redirectTo('/admin/email-system', { success: 'Email template removed.' });
});
