import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { extractVariables, templateRules } from '@/lib/domain/prompt-templates';

/** POST /app/prompt-templates */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.prompt-templates.store' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), templateRules());

    await prisma.promptTemplate.create({
        data: {
            client_id: BigInt(gate.clientId),
            name: data.name,
            description: data.description ?? null,
            category: data.category,
            content: data.content,
            variables: extractVariables(data.content),
            is_system: false,
            usage_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Template created.' });
});
