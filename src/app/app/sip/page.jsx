import SipIndex from '@/views/client/Sip/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage, requirePlanFeaturePage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { planFor } from '@/lib/plans';
import { SIP_PROVIDERS, allSipEngines } from '@/lib/services/sip';

export const dynamic = 'force-dynamic';

/** GET /app/sip (plan.feature:sip). */
export default async function Page() {
    const { user, clientId } = await requireClientPage();
    await requirePlanFeaturePage(user, 'sip');

    const client_id = BigInt(clientId);
    const plan = await planFor(clientId);

    const trunkRows = await prisma.sipTrunk.findMany({
        where: { client_id },
        include: { _count: { select: { phone_numbers: true } } },
        orderBy: { id: 'desc' },
    });

    const numberRows = await prisma.phoneNumber.findMany({
        where: { client_id, source: 'sip' },
        include: {
            sip_trunks: { select: { id: true, name: true } },
            agents: { select: { id: true, name: true } },
        },
        orderBy: { id: 'desc' },
    });

    const [trunksTotal, trunksActive, agents] = await Promise.all([
        prisma.sipTrunk.count({ where: { client_id } }),
        prisma.sipTrunk.count({ where: { client_id, status: 'active' } }),
        prisma.agent.findMany({
            where: { client_id, status: 'active', deleted_at: null },
            select: { id: true, name: true },
        }),
    ]);

    const props = {
        // Credentials are excluded here, matching the model's $hidden.
        trunks: trunkRows.map((t) => ({
            id: Number(t.id),
            name: t.name,
            provider: t.provider,
            engine: t.engine,
            sip_host: t.sip_host,
            sip_port: t.sip_port,
            transport: t.transport,
            inbound_enabled: t.inbound_enabled,
            outbound_enabled: t.outbound_enabled,
            concurrency_limit: t.concurrency_limit,
            status: t.status,
            numbers_count: t._count.phone_numbers,
        })),
        numbers: numberRows.map((n) => ({
            id: Number(n.id),
            e164_number: n.e164_number,
            direction: n.direction,
            trunk: n.sip_trunks?.name ?? null,
            agent: n.agents?.name ?? null,
            status: n.status,
        })),
        stats: [
            { label: 'Total trunks', value: trunksTotal, icon: 'network', accent: 'brand' },
            { label: 'Active', value: trunksActive, icon: 'check', accent: 'signal' },
            { label: 'SIP numbers', value: numberRows.length, icon: 'phone', accent: 'cold' },
        ],
        providerTemplates: SIP_PROVIDERS,
        engines: allSipEngines(),
        agents: plain(agents),
        limits: {
            trunks: Number(plan?.sip_trunks_limit ?? 0),
            trunks_used: trunksTotal,
            numbers: Number(plan?.sip_numbers_limit ?? 0),
            numbers_used: numberRows.length,
        },
    };

    return renderPage(SipIndex, 'client/Sip/Index', props, { url: '/app/sip' });
}
