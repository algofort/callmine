import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { abort, back } from '@/lib/http';

/**
 * POST /app/prompt-templates/{promptTemplate}/duplicate
 * — clones any visible template into an
 * editable copy owned by this client.
 */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.prompt-templates.duplicate' });
    if (gate.response) return gate.response;

    const { promptTemplate: id } = await params;
    const tpl = await prisma.promptTemplate.findUnique({ where: { id: BigInt(id) } });
    if (!tpl) return abort(404);
    if (!tpl.is_system && String(tpl.client_id) !== String(gate.clientId)) return abort(403);

    await prisma.promptTemplate.create({
        data: {
            client_id: BigInt(gate.clientId),
            name: `${tpl.name} (copy)`,
            description: tpl.description,
            category: tpl.category,
            content: tpl.content,
            variables: tpl.variables ?? [],
            is_system: false,
            usage_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'Template duplicated.' });
});
