import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back } from '@/lib/http';
import { defaultDriver } from '@/lib/services/telephony';

/** DELETE /admin/phone-pool/{phoneNumber} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.phone-pool.release', 'manage_settings');
    if (gate.response) return gate.response;

    const { phoneNumber: id } = await params;
    const number = await prisma.phoneNumber.findUnique({ where: { id: BigInt(id) } });
    if (!number) return abort(404);

    const telephony = defaultDriver();
    if (number.twilio_sid && (await telephony.isConfigured())) {
        await telephony.releaseNumber(number.twilio_sid);
    }

    await prisma.phoneNumber.delete({ where: { id: number.id } });

    return back({ success: 'Number released.' });
});
