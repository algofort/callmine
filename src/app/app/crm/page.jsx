import CrmBoard from '@/views/client/Crm/Board';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { STAGES } from '@/lib/domain/contacts';

export const dynamic = 'force-dynamic';

/** GET /app/crm */
export default async function Page() {
    const { clientId } = await requireClientPage();

    const contacts = await prisma.contact.findMany({
        where: { client_id: BigInt(clientId) },
        select: { id: true, name: true, phone: true, email: true, company: true, pipeline_stage: true },
    });

    const keys = Object.keys(STAGES);
    const grouped = {};
    for (const c of contacts) {
        const stage = keys.includes(c.pipeline_stage) ? c.pipeline_stage : 'new';
        (grouped[stage] ??= []).push({
            id: Number(c.id),
            name: c.name,
            phone: c.phone,
            email: c.email,
            company: c.company,
            pipeline_stage: c.pipeline_stage ?? 'new',
        });
    }

    const countFor = (stage) => grouped[stage]?.length ?? 0;

    const props = {
        columns: keys.map((key) => ({ key, label: STAGES[key], contacts: grouped[key] ?? [] })),
        stats: [
            { label: 'Total leads', value: contacts.length, icon: 'users', accent: 'brand' },
            { label: 'Qualified', value: countFor('qualified'), icon: 'target', accent: 'signal' },
            { label: 'Won', value: countFor('won'), icon: 'check', accent: 'cold' },
            { label: 'Lost', value: countFor('lost'), icon: 'shield', accent: 'warm' },
        ],
        stages: keys.map((key) => ({ key, label: STAGES[key] })),
    };

    return renderPage(CrmBoard, 'client/Crm/Board', props, { url: '/app/crm' });
}
