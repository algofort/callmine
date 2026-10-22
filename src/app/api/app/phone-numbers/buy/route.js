import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { gateClient, gateKyc, gatePlanLimit, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { toE164 } from '@/lib/domain/contacts';
import { balance, chargeNumberMonthly, InsufficientCreditsError } from '@/lib/services/credits';
import { defaultDriver } from '@/lib/services/telephony';

/**
 * POST /app/phone-numbers/buy
 * (middleware kyc.verified + plan.limit:numbers).
 */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.phone-numbers.buy' });
    if (gate.response) return gate.response;

    const kyc = await gateKyc(gate.user);
    if (kyc) return kyc;

    const limited = await gatePlanLimit(gate.clientId, 'numbers');
    if (limited) return limited;

    const data = await validate(await readBody(request), {
        phone: ['required', 'string', 'max:32'],
        type: ['nullable', 'string', 'in:local,toll_free,mobile,international'],
        country: ['nullable', 'string', 'size:2'],
        friendly_name: ['nullable', 'string', 'max:255'],
        // true = import a number the account already owns (trial/BYO), no purchase.
        owned: ['nullable', 'boolean'],
    });

    let e164 = toE164(data.phone);
    if (!e164) return back({ error: 'That phone number is not valid.' });

    const cost = config.telephony.number_cost_credits;
    if ((await balance(gate.clientId)) < cost) {
        return back({ error: `Not enough credits to buy this number (${cost} credits/month).` });
    }

    const telephony = defaultDriver();
    const configured = await telephony.isConfigured();
    let sid = null;

    if (data.owned) {
        // Record an already-owned number, grabbing the provider SID when it is on the
        // account so a later release still works. Otherwise keep it as BYO.
        if (configured) {
            const found = await telephony.findOwnedNumber(e164);
            sid = found?.sid ?? null;
            e164 = found?.e164 ?? e164;
        }
    } else if (configured) {
        const result = await telephony.buyNumber(e164);
        if (!result.ok) return back({ error: result.error ?? 'Could not purchase that number.' });
        sid = result.sid ?? null;
        e164 = result.e164 ?? e164;
    }

    const number = await prisma.phoneNumber.create({
        data: {
            client_id: BigInt(gate.clientId),
            twilio_sid: sid,
            e164_number: e164,
            friendly_name: data.friendly_name ?? e164,
            type: data.type ?? 'local',
            country: data.country ? String(data.country).toUpperCase() : null,
            monthly_cost_credits: cost,
            purchased_at: new Date(),
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    try {
        await chargeNumberMonthly(number);
    } catch (e) {
        if (!(e instanceof InsufficientCreditsError)) throw e;

        await prisma.phoneNumber.delete({ where: { id: number.id } });
        // Release the just-provisioned number so the buyer is not billed for an orphan.
        if (sid && configured) {
            try {
                await telephony.releaseNumber(sid);
            } catch {
                // best-effort; the number is already unusable locally
            }
        }
        return back({ error: 'Not enough credits to buy this number.' });
    }

    return back({ success: `Number ${e164} is now active.` });
});
