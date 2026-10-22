import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { limitFor } from '@/lib/plans';
import { deleteFile, storeFile } from '@/lib/storage';
import { extractText } from '@/lib/services/document-text';
import { resolveSafeTarget } from '@/lib/services/outbound-guard';

/** POST /app/knowledge-base */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.knowledge-base.store' });
    if (gate.response) return gate.response;

    const body = await readBody(request);

    const data = await validate(body, {
        type: ['required', 'string', 'in:url,file,text'],
        title: ['required', 'string', 'max:255'],
        source_url: body.type === 'url' ? ['required', 'url', 'max:2048'] : ['nullable'],
        content: body.type === 'text' ? ['required', 'string', 'max:200000'] : ['nullable'],
    });

    if (body.type === 'file' && !(body.file instanceof File)) {
        return back({ error: 'A file is required.' });
    }

    const [content, filePath, size, status] = await ingest(body, data, gate.clientId);

    const client_id = BigInt(gate.clientId);
    const limitMb = (await limitFor(gate.clientId, 'kb_mb')) ?? 0;
    const usedAgg = await prisma.knowledgeBaseItem.aggregate({
        where: { client_id },
        _sum: { file_size_bytes: true },
    });
    const usedBytes = Number(usedAgg._sum.file_size_bytes ?? 0);

    if (limitMb > 0 && usedBytes + size > limitMb * 1048576) {
        if (filePath) await deleteFile(filePath);
        return back({ error: `Knowledge base storage limit (${limitMb} MB) reached.` });
    }

    await prisma.knowledgeBaseItem.create({
        data: {
            client_id,
            type: data.type,
            title: data.title,
            source_url: data.source_url ?? null,
            file_path: filePath,
            file_size_bytes: size,
            content,
            tokens: content ? Math.ceil(content.length / 4) : null,
            status,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    if (status === 'failed') {
        const what = data.type === 'url' ? 'page' : 'file';
        return back({
            error: `We couldn't read any text from that ${what}. Scanned or image-only PDFs aren't supported — try a text-based file, or paste the content directly.`,
        });
    }

    return back({ success: 'Knowledge base item added and ready for your agents.' });
});

/** → [content, filePath, sizeBytes, status] */
async function ingest(body, data, clientId) {
    if (data.type === 'text') {
        const content = String(data.content ?? '');
        return [content, null, Buffer.byteLength(content), 'ready'];
    }

    if (data.type === 'url') {
        try {
            // SSRF guard, as App\Support\OutboundHttpGuard did.
            const target = await resolveSafeTarget(String(data.source_url));
            if (!target) return [null, null, 0, 'failed'];

            const res = await fetch(String(data.source_url), {
                redirect: 'manual',
                signal: AbortSignal.timeout(15000),
            });
            if (res.ok) {
                const html = await res.text();
                const text = html
                    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 100000);
                return [text, null, Buffer.byteLength(text), 'ready'];
            }
        } catch {
            /* fall through to failed */
        }
        return [null, null, 0, 'failed'];
    }

    const file = body.file;
    const path = await storeFile(file, `knowledge-base/${clientId}`, 'local');
    const size = file.size ?? 0;
    const ext = (file.name?.split('.').pop() ?? '').toLowerCase();
    const content = await extractText(path, ext);

    return [content, path, Number(size), content ? 'ready' : 'failed'];
}
