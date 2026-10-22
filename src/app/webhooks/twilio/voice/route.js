import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { formDataToObject, queryParams } from '@/lib/http';
import { verifyTwilioSignature } from '@/lib/webhooks/signatures';
import {
    CALL_STATUS,
    appendTurn,
    escapeXml,
    gatherAction,
    gatherTwiml,
    loadCall,
    twiml,
} from '@/lib/webhooks/twiml';
import { greeting as agentGreeting } from '@/lib/services/agent-conversation';

/** POST /webhooks/twilio/voice */
export const POST = handler(async (request) => {
    const form = formDataToObject(await request.formData());

    const check = await verifyTwilioSignature(request, form);
    if (!check.ok) return check.response;

    const call = await loadCall(queryParams(request).c);
    if (!call) return twiml('<Say>Sorry, this call is no longer available.</Say><Hangup/>');

    await prisma.call.update({
        where: { id: call.id },
        data: { status: CALL_STATUS.IN_PROGRESS, updated_at: new Date() },
    });

    const line = call.agents
        ? agentGreeting(call.agents, call.contacts)
        : 'Hello, thanks for taking the call.';

    const updated = await appendTurn(call, 'agent', line);

    try {
        return twiml(await gatherTwiml({ ...call, ...updated }, line));
    } catch (e) {
        // Synthesis failed — still gather, using the carrier voice.
        console.error('[twilio voice]', e?.message);
        const action = gatherAction(Number(call.id), 'twilio');
        return twiml(
            `<Gather input="speech" speechTimeout="auto" action="${escapeXml(action)}" method="POST">` +
                `<Say>${escapeXml(line)}</Say></Gather>`,
        );
    }
});
