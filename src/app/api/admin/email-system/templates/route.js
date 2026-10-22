import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { slugify } from '@/lib/domain/admin-plans';

const rules = {
    name: ['required', 'string', 'max:255'],
    slug: ['nullable', 'string', 'max:128'],
    subject: ['nullable', 'string', 'max:255'],
    content: ['nullable', 'string'],
    enabled: ['nullable', 'boolean'],
};

/** POST /admin/email-system/templates — ::storeTemplate() */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.email-system.templates.store', 'manage_email_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), rules);
    const slug = data.slug || slugify(data.name);

    if (await prisma.template.findUnique({ where: { slug } })) {
        return validationError({ slug: ['The slug has already been taken.'] });
    }

    await prisma.template.create({
        data: {
            name: data.name,
            slug,
            subject: data.subject ?? null,
            content: data.content ?? null,
            type: 'email',
            enabled: data.enabled ?? true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo('/admin/email-system', { success: 'Email template created.' });
});
