import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyPlivoSignature } from '@/lib/webhooks/signatures';
import { processCallResult } from '@/lib/services/call-results';

/** POST /webhooks/plivo/status */
export const POST = handler(async (request) => {
    const check = await verifyPlivoSignature(request);
    if (!check.ok) return check.response;

    const form = formDataToObject(await request.formData());

    const callId = Number(queryParams(request).c ?? 0);
    const status = String(form.CallStatus ?? 'completed').toLowerCase();
    const duration = Number(form.Duration ?? 0);

    // Plivo's vocabulary mapped onto the carrier-neutral statuses.
    const map = {
        completed: 'completed',
        busy: 'busy',
        'no-answer': 'no-answer',
        failed: 'failed',
        timeout: 'no-answer',
    };

    if (callId && map[status]) {
        processCallResult(callId, map[status], duration).catch((e) =>
            console.error('[plivo status] processing failed:', e?.message),
        );
    }

    return new Response('', { status: 204 });
});
