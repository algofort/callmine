import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyTwilioSignature } from '@/lib/webhooks/signatures';
import { processCallResult } from '@/lib/services/call-results';

/** POST /webhooks/twilio/status */
export const POST = handler(async (request) => {
    const form = formDataToObject(await request.formData());

    const check = await verifyTwilioSignature(request, form);
    if (!check.ok) return check.response;

    const callId = Number(queryParams(request).c ?? 0);
    const status = String(form.CallStatus ?? 'completed');
    const duration = Number(form.CallDuration ?? 0);

    if (callId && ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(status)) {
        // Run inline, but never make the carrier wait on it.
        processCallResult(callId, status, duration).catch((e) =>
            console.error('[twilio status] processing failed:', e?.message),
        );
    }

    return new Response('', { status: 204 });
});
