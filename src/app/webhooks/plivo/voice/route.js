import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { queryParams } from '@/lib/http';
import { verifyPlivoSignature } from '@/lib/webhooks/signatures';
import { CALL_STATUS, appendTurn, loadCall } from '@/lib/webhooks/twiml';
import { getInputXml, plivoXml, speak } from '@/lib/webhooks/plivo-xml';
import { greeting as agentGreeting } from '@/lib/services/agent-conversation';

/** POST /webhooks/plivo/voice */
export const POST = handler(async (request) => {
    const check = await verifyPlivoSignature(request);
    if (!check.ok) return check.response;

    const call = await loadCall(queryParams(request).c);
    if (!call) return plivoXml(`${speak('Sorry, this call is no longer available.')}<Hangup/>`);

    await prisma.call.update({
        where: { id: call.id },
        data: { status: CALL_STATUS.IN_PROGRESS, updated_at: new Date() },
    });

    const line = call.agents
        ? agentGreeting(call.agents, call.contacts)
        : 'Hello, thanks for taking the call.';

    await appendTurn(call, 'agent', line);

    return plivoXml(getInputXml(Number(call.id), line));
});
