import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { STAGES } from '@/lib/domain/contacts';

/** PUT /app/crm/{contact}/stage */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.crm.update-stage' });
    if (gate.response) return gate.response;

    const { contact: id } = await params;
    const contact = await prisma.contact.findUnique({ where: { id: BigInt(id) } });
    assertOwned(contact, gate.clientId);

    const data = await validate(await readBody(request), {
        stage: ['required', 'string', `in:${Object.keys(STAGES).join(',')}`],
    });

    await prisma.contact.update({
        where: { id: contact.id },
        data: { pipeline_stage: data.stage, updated_at: new Date() },
    });

    return back();
});
