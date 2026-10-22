import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, redirectTo, validate, validationError } from '@/lib/http';
import { formRules, validateFields } from '@/lib/domain/forms';

/** PUT /app/forms/{form} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.forms.update' });
    if (gate.response) return gate.response;

    const { form: id } = await params;
    const form = await prisma.form.findUnique({ where: { id: BigInt(id) } });
    assertOwned(form, gate.clientId);

    const data = await validate(await readBody(request), formRules());

    const fieldErrors = validateFields(data.fields);
    if (fieldErrors) return validationError(fieldErrors);

    await prisma.form.update({
        where: { id: form.id },
        data: {
            name: data.name,
            description: data.description ?? null,
            status: data.status ?? form.status,
            fields: data.fields ?? [],
            updated_at: new Date(),
        },
    });

    return back({ success: 'Form updated.' });
});

/** DELETE /app/forms/{form} (soft delete). */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.forms.destroy' });
    if (gate.response) return gate.response;

    const { form: id } = await params;
    const form = await prisma.form.findUnique({ where: { id: BigInt(id) } });
    assertOwned(form, gate.clientId);

    await prisma.form.update({
        where: { id: form.id },
        data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return redirectTo('/app/forms', { success: 'Form deleted.' });
});
