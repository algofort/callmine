import { handler } from '@/lib/guards';
import { SIP_ENGINES, sipEngineForKey } from '@/lib/services/sip';

/** POST /webhooks/sip/openai */
export const POST = handler(async (request) => {
    const engine = sipEngineForKey(SIP_ENGINES.OPENAI);

    if (!engine || !(await engine.verifyWebhook(request))) {
        return new Response('Forbidden', { status: 403 });
    }

    return new Response('', { status: 200 });
});
