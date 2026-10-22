import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { toE164 } from '@/lib/domain/contacts';
import { defaultDriver } from '@/lib/services/telephony';

/** POST /admin/phone-pool/buy */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.phone-pool.buy', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        phone: ['required', 'string', 'max:32'],
        type: ['nullable', 'in:local,toll_free,mobile'],
        country: ['nullable', 'string', 'size:2'],
    });

    let e164 = toE164(data.phone);
    if (!e164) return back({ error: 'Invalid phone number.' });

    const telephony = defaultDriver();
    let sid = null;

    if (await telephony.isConfigured()) {
        const result = await telephony.buyNumber(e164);
        if (!result.ok) return back({ error: result.error ?? 'Could not purchase number.' });
        sid = result.sid ?? null;
        e164 = result.e164 ?? e164;
    }

    // client_id stays null — the number sits in the system pool until assigned.
    await prisma.phoneNumber.create({
        data: {
            client_id: null,
            twilio_sid: sid,
            e164_number: e164,
            friendly_name: e164,
            type: data.type ?? 'local',
            country: data.country ? String(data.country).toUpperCase() : null,
            monthly_cost_credits: config.telephony.number_cost_credits,
            purchased_at: new Date(),
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Number added to the system pool.' });
});
