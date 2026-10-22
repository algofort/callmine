import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back, readBody, validate, validationError } from '@/lib/http';

/** POST /app/sip/numbers/{phoneNumber}/assign */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.sip.numbers.assign' });
    if (gate.response) return gate.response;

    const { phoneNumber: id } = await params;
    const number = await prisma.phoneNumber.findUnique({ where: { id: BigInt(id) } });
    assertOwned(number, gate.clientId);

    const data = await validate(await readBody(request), { agent_id: ['nullable', 'integer'] });

    if (data.agent_id) {
        const agent = await prisma.agent.findFirst({
            where: { id: BigInt(data.agent_id), client_id: BigInt(gate.clientId), deleted_at: null },
        });
        if (!agent) return validationError({ agent_id: ['The selected agent id is invalid.'] });
    }

    await prisma.phoneNumber.update({
        where: { id: number.id },
        data: { agent_id: data.agent_id ? BigInt(data.agent_id) : null, updated_at: new Date() },
    });

    return back({ success: 'Agent assigned.' });
});
