import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { readBody, redirectTo, validate, validationError } from '@/lib/http';
import { FORM_STATUS, formRules, validateFields } from '@/lib/domain/forms';

/** POST /app/forms */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.forms.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), formRules());

    const fieldErrors = validateFields(data.fields);
    if (fieldErrors) return validationError(fieldErrors);

    const form = await prisma.form.create({
        data: {
            client_id: BigInt(gate.clientId),
            user_id: gate.user.id,
            name: data.name,
            description: data.description ?? null,
            status: data.status ?? FORM_STATUS.ACTIVE,
            fields: data.fields ?? [],
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return redirectTo(`/app/forms/${Number(form.id)}/edit`, { success: 'Form created.' });
});
