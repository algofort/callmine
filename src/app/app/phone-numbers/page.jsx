import PhoneNumbersIndex from '@/views/client/PhoneNumbers/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { iso } from '@/lib/serialize';
import { limitFor, usageFor } from '@/lib/plans';
import { balance } from '@/lib/services/credits';
import { defaultDriver } from '@/lib/services/telephony';

export const dynamic = 'force-dynamic';

/** GET /app/phone-numbers */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const client_id = BigInt(clientId);

    const rows = await prisma.phoneNumber.findMany({
        where: { client_id, status: 'active' },
        orderBy: { id: 'desc' },
    });

    const active = { client_id, status: 'active' };
    const [total, assigned, unassigned, creditBalance, limit, usage] = await Promise.all([
        prisma.phoneNumber.count({ where: active }),
        prisma.phoneNumber.count({ where: { ...active, agent_id: { not: null } } }),
        prisma.phoneNumber.count({ where: { ...active, agent_id: null } }),
        balance(clientId),
        limitFor(clientId, 'numbers'),
        usageFor(clientId, 'numbers'),
    ]);

    const props = {
        numbers: rows.map((n) => ({
            id: Number(n.id),
            e164_number: n.e164_number,
            friendly_name: n.friendly_name,
            type: n.type,
            country: n.country,
            monthly_cost_credits: n.monthly_cost_credits,
            twilio_sid: n.twilio_sid,
            purchased_at: iso(n.purchased_at),
        })),
        stats: [
            { label: 'Total numbers', value: total, icon: 'phone', accent: 'brand' },
            { label: 'Assigned', value: assigned, icon: 'phone-call', accent: 'signal' },
            { label: 'Unassigned', value: unassigned, icon: 'plug', accent: 'warm' },
        ],
        twilioConfigured: await defaultDriver().isConfigured(),
        numberCostCredits: config.telephony.number_cost_credits,
        creditBalance,
        limit: { limit: limit ?? 0, usage },
    };

    return renderPage(PhoneNumbersIndex, 'client/PhoneNumbers/Index', props, {
        url: '/app/phone-numbers',
    });
}
