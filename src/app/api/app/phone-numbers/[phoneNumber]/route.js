import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { defaultDriver } from '@/lib/services/telephony';

/** DELETE /app/phone-numbers/{phoneNumber} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.phone-numbers.release' });
    if (gate.response) return gate.response;

    const { phoneNumber: id } = await params;
    const number = await prisma.phoneNumber.findUnique({ where: { id: BigInt(id) } });
    assertOwned(number, gate.clientId);

    const telephony = defaultDriver();
    if (number.twilio_sid && (await telephony.isConfigured())) {
        await telephony.releaseNumber(number.twilio_sid);
    }

    await prisma.phoneNumber.update({
        where: { id: number.id },
        data: { status: 'released', updated_at: new Date() },
    });

    return back({ success: 'Number released.' });
});
