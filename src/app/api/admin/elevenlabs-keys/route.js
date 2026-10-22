import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { KEY_STATUS } from '@/lib/services/elevenlabs';

/** POST /admin/elevenlabs-keys */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.elevenlabs-keys.store', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        label: ['required', 'string', 'max:64'],
        api_key: ['required', 'string', 'max:255'],
        max_concurrency: ['required', 'integer', 'min:1', 'max:1000'],
    });

    await prisma.elevenLabsKey.create({
        data: {
            label: data.label,
            api_key: data.api_key,
            max_concurrency: data.max_concurrency,
            status: KEY_STATUS.ACTIVE,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return back({ success: 'API key added.' });
});
