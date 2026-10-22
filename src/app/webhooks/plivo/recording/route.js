import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyPlivoSignature } from '@/lib/webhooks/signatures';

/** POST /webhooks/plivo/recording */
export const POST = handler(async (request) => {
    const check = await verifyPlivoSignature(request);
    if (!check.ok) return check.response;

    const form = formDataToObject(await request.formData());
    const callId = queryParams(request).c;

    if (callId) {
        await prisma.call
            .update({
                where: { id: BigInt(callId) },
                data: {
                    recording_url: form.RecordUrl ?? form.RecordingUrl ?? null,
                    recording_sid: form.RecordingID ?? form.RecordingId ?? null,
                    updated_at: new Date(),
                },
            })
            .catch(() => {});
    }

    return new Response('', { status: 204 });
});
