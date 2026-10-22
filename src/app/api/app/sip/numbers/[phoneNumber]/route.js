import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back } from '@/lib/http';

/** DELETE /app/sip/numbers/{phoneNumber} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.sip.numbers.destroy' });
    if (gate.response) return gate.response;

    const { phoneNumber: id } = await params;
    const number = await prisma.phoneNumber.findUnique({ where: { id: BigInt(id) } });

    // Only this client's SIP-sourced numbers may be released here.
    if (!number) return abort(404);
    if (String(number.client_id) !== String(gate.clientId) || number.source !== 'sip') return abort(403);

    await prisma.phoneNumber.delete({ where: { id: number.id } });
    return back({ success: 'Number released.' });
});
