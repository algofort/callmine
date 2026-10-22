import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyTwilioSignature } from '@/lib/webhooks/signatures';
import { gatherTwiml, loadCall, nextTurn, say, twiml } from '@/lib/webhooks/twiml';

/** POST /webhooks/twilio/gather */
export const POST = handler(async (request) => {
    const form = formDataToObject(await request.formData());

    const check = await verifyTwilioSignature(request, form);
    if (!check.ok) return check.response;

    const call = await loadCall(queryParams(request).c);
    if (!call) return twiml('<Hangup/>');

    try {
        const speech = String(form.SpeechResult ?? '').trim();
        const { text, end } = await nextTurn(call, speech);

        if (end) return twiml((await say(call, text)) + '<Hangup/>');
        return twiml(await gatherTwiml(call, text));
    } catch (e) {
        console.error('[twilio gather]', e?.message);
        return twiml(
            await gatherTwiml(call, "Sorry, I'm having trouble hearing you. Could you repeat that?"),
        );
    }
});
