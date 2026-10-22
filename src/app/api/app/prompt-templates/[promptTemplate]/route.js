import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back, readBody, validate } from '@/lib/http';
import { extractVariables, templateRules } from '@/lib/domain/prompt-templates';

/** Custom templates only — system rows are read-only (authorizeOwn). */
async function ownTemplate(id, clientId) {
    const tpl = await prisma.promptTemplate.findUnique({ where: { id: BigInt(id) } });
    if (!tpl) return { error: abort(404) };
    if (tpl.is_system || String(tpl.client_id) !== String(clientId)) return { error: abort(403) };
    return { tpl };
}

/** PUT /app/prompt-templates/{promptTemplate} */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.prompt-templates.update' });
    if (gate.response) return gate.response;

    const { promptTemplate: id } = await params;
    const { tpl, error } = await ownTemplate(id, gate.clientId);
    if (error) return error;

    const data = await validate(await readBody(request), templateRules());

    await prisma.promptTemplate.update({
        where: { id: tpl.id },
        data: {
            name: data.name,
            description: data.description ?? null,
            category: data.category,
            content: data.content,
            variables: extractVariables(data.content),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Template updated.' });
});

/** DELETE /app/prompt-templates/{promptTemplate} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.prompt-templates.destroy' });
    if (gate.response) return gate.response;

    const { promptTemplate: id } = await params;
    const { tpl, error } = await ownTemplate(id, gate.clientId);
    if (error) return error;

    await prisma.promptTemplate.delete({ where: { id: tpl.id } });
    return back({ success: 'Template deleted.' });
});
