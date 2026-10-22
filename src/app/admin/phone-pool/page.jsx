import AdminPhonePool from '@/views/Admin/PhonePool/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { plain } from '@/lib/serialize';
import { defaultDriver } from '@/lib/services/telephony';

export const dynamic = 'force-dynamic';

/** GET /admin/phone-pool */
export default async function Page() {
    await requireAdminPermissions('view_settings');

    const [pool, assignedRows, total, assignedCount, customers] = await Promise.all([
        prisma.phoneNumber.findMany({ where: { client_id: null }, orderBy: { id: 'desc' } }),
        prisma.phoneNumber.findMany({
            where: { client_id: { not: null } },
            include: { clients: { select: { id: true, name: true } } },
            orderBy: { id: 'desc' },
            take: 50,
        }),
        prisma.phoneNumber.count(),
        prisma.phoneNumber.count({ where: { client_id: { not: null } } }),
        prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);

    const props = {
        numbers: pool.map((n) => ({
            id: Number(n.id),
            e164_number: n.e164_number,
            type: n.type,
            country: n.country,
            monthly_cost_credits: n.monthly_cost_credits,
            twilio_sid: n.twilio_sid,
            status: n.status,
        })),
        assigned: assignedRows.map((n) => ({
            id: Number(n.id),
            e164_number: n.e164_number,
            customer: n.clients?.name ?? null,
        })),
        customers: plain(customers),
        twilioConfigured: await defaultDriver().isConfigured(),
        numberCostCredits: config.telephony.number_cost_credits,
        stats: [
            { label: 'Total numbers', value: total, icon: 'phone', accent: 'brand' },
            { label: 'Assigned', value: assignedCount, icon: 'building', accent: 'signal' },
            { label: 'Available', value: pool.length, icon: 'phone-call', accent: 'cold' },
        ],
    };

    return renderPage(AdminPhonePool, 'Admin/PhonePool/Index', props, {
        url: '/admin/phone-pool',
        isAdminRoute: true,
    });
}
