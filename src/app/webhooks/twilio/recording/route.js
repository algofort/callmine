import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyTwilioSignature } from '@/lib/webhooks/signatures';

/** POST /webhooks/twilio/recording */
export const POST = handler(async (request) => {
    const form = formDataToObject(await request.formData());

    const check = await verifyTwilioSignature(request, form);
    if (!check.ok) return check.response;

    const callId = queryParams(request).c;
    if (callId) {
        await prisma.call
            .update({
                where: { id: BigInt(callId) },
                data: {
                    recording_url: form.RecordingUrl ?? null,
                    recording_sid: form.RecordingSid ?? null,
                    updated_at: new Date(),
                },
            })
            .catch(() => {});
    }

    return new Response('', { status: 204 });
});
