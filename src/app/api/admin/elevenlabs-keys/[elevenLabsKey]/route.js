import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';

/** PUT /admin/elevenlabs-keys/{elevenLabsKey} — ::update() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.elevenlabs-keys.update', 'manage_settings');
    if (gate.response) return gate.response;

    const { elevenLabsKey: id } = await params;

    const data = await validate(await readBody(request), {
        label: ['required', 'string', 'max:64'],
        max_concurrency: ['required', 'integer', 'min:1', 'max:1000'],
        status: ['required', 'string', 'in:active,inactive,unhealthy'],
        api_key: ['nullable', 'string', 'max:255'],
    });

    await prisma.elevenLabsKey.update({
        where: { id: BigInt(id) },
        data: {
            label: data.label,
            max_concurrency: data.max_concurrency,
            status: data.status,
            // Blank means "keep the stored key".
            ...(data.api_key ? { api_key: data.api_key } : {}),
            updated_at: new Date(),
        },
    });

    return back({ success: 'API key updated.' });
});

/** DELETE /admin/elevenlabs-keys/{elevenLabsKey} — ::destroy() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.elevenlabs-keys.destroy', 'manage_settings');
    if (gate.response) return gate.response;

    const { elevenLabsKey: id } = await params;
    await prisma.elevenLabsKey.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return back({ success: 'API key removed.' });
});
