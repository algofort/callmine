import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { paginate } from '@/lib/paginate';
import { pageFrom, perPageFrom, shapeCall } from '@/lib/api/shapes';
import { readBody, validate } from '@/lib/http';
import { toE164 } from '@/lib/domain/contacts';

/** GET /api/v1/calls (scope calls:read). */
export const GET = apiRoute('calls:read', async (request, { clientId }) => {
    const calls = await paginate(prisma.call, {
        where: { client_id: clientId },
        orderBy: { id: 'desc' },
        perPage: perPageFrom(request),
        page: pageFrom(request),
        path: '/api/v1/calls',
        transform: (c) => shapeCall(c),
    });

    return apiJson(calls);
});

/** POST /api/v1/calls (scope calls:write). */
export const POST = apiRoute('calls:write', async (request, { clientId }) => {
    const data = await validate(await readBody(request), {
        agent_id: ['required', 'integer'],
        phone_number_id: ['required', 'integer'],
        phone: ['required', 'string', 'max:32'],
        name: ['nullable', 'string', 'max:255'],
        campaign_id: ['nullable', 'integer'],
    });

    // Every foreign key must belong to the calling customer.
    const [agent, number, campaign] = await Promise.all([
        prisma.agent.findFirst({ where: { id: BigInt(data.agent_id), client_id: clientId, deleted_at: null } }),
        prisma.phoneNumber.findFirst({ where: { id: BigInt(data.phone_number_id), client_id: clientId } }),
        data.campaign_id
            ? prisma.campaign.findFirst({
                  where: { id: BigInt(data.campaign_id), client_id: clientId, deleted_at: null },
              })
            : Promise.resolve(null),
    ]);

    const errors = {};
    if (!agent) errors.agent_id = ['The selected agent id is invalid.'];
    if (!number) errors.phone_number_id = ['The selected phone number id is invalid.'];
    if (data.campaign_id && !campaign) errors.campaign_id = ['The selected campaign id is invalid.'];
    if (Object.keys(errors).length) {
        return apiJson({ message: 'The given data was invalid.', errors }, 422);
    }

    const e164 = toE164(data.phone);
    if (!e164) return apiJson({ message: 'Invalid phone number.' }, 422);

    let contact = await prisma.contact.findFirst({ where: { client_id: clientId, phone: e164 } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                client_id: clientId,
                phone: e164,
                name: data.name ?? null,
                source: 'api',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    const job = await prisma.callQueueJob.create({
        data: {
            client_id: clientId,
            campaign_id: data.campaign_id ? BigInt(data.campaign_id) : null,
            contact_id: contact.id,
            agent_id: BigInt(data.agent_id),
            phone_number_id: BigInt(data.phone_number_id),
            status: 'pending',
            scheduled_for: new Date(),
            max_retries: 3,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return apiJson(
        { queued: true, queue_job_id: Number(job.id), contact_id: Number(contact.id) },
        201,
    );
});
