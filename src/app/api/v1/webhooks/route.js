import prisma from '@/lib/prisma';
import { apiRoute, apiJson } from '@/lib/api/middleware';
import { plain } from '@/lib/serialize';
import { readBody, validate } from '@/lib/http';
import { randomToken } from '@/lib/domain/widget';

/** GET /api/v1/webhooks */
export const GET = apiRoute('webhooks:read', async (request, { clientId }) => {
    const hooks = await prisma.webhook.findMany({
        where: { client_id: clientId },
        select: {
            id: true, name: true, target_url: true,
            events: true, campaign_id: true, is_active: true,
        },
    });

    return apiJson(plain(hooks));
});

/** POST /api/v1/webhooks */
export const POST = apiRoute('webhooks:write', async (request, { clientId }) => {
    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        target_url: ['required', 'url'],
        events: ['nullable', 'array'],
    });

    const hook = await prisma.webhook.create({
        data: {
            client_id: clientId,
            name: data.name,
            target_url: data.target_url,
            events: data.events ?? ['call.completed'],
            secret: `whsec_${randomToken(40)}`,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // The secret is returned once, at creation.
    return apiJson({ id: Number(hook.id), secret: hook.secret }, 201);
});
