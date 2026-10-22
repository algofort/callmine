import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyPlivoSignature } from '@/lib/webhooks/signatures';
import { loadCall, nextTurn } from '@/lib/webhooks/twiml';
import { getInputXml, plivoXml, speak } from '@/lib/webhooks/plivo-xml';

/** POST /webhooks/plivo/gather */
export const POST = handler(async (request) => {
    const check = await verifyPlivoSignature(request);
    if (!check.ok) return check.response;

    const call = await loadCall(queryParams(request).c);
    if (!call) return plivoXml('<Hangup/>');

    const form = formDataToObject(await request.formData());
    const speech = String(form.Speech ?? '').trim();

    const { text, end } = await nextTurn(call, speech);

    if (end) return plivoXml(`${speak(text)}<Hangup/>`);
    return plivoXml(getInputXml(Number(call.id), text));
});
