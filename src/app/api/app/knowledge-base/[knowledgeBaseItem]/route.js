import prisma from '@/lib/prisma';
import { assertOwned, gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { deleteFile } from '@/lib/storage';

/** DELETE /app/knowledge-base/{knowledgeBaseItem} */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.knowledge-base.destroy' });
    if (gate.response) return gate.response;

    const { knowledgeBaseItem: id } = await params;
    const item = await prisma.knowledgeBaseItem.findUnique({ where: { id: BigInt(id) } });
    assertOwned(item, gate.clientId);

    if (item.file_path) await deleteFile(item.file_path);
    await prisma.knowledgeBaseItem.delete({ where: { id: item.id } });

    return back({ success: 'Knowledge base item removed.' });
});
