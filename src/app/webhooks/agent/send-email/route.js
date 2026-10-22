import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { abort, readBody, validate } from '@/lib/http';
import { agentTokenMatches } from '@/lib/webhooks/agent-token';
import { sendEmailMessage } from '@/lib/services/messaging';
import { hit, throttleKey, tooManyAttempts } from '@/lib/rate-limit';

/** POST /webhooks/agent/send-email */
export const POST = handler(async (request) => {
    // throttle:60,1
    const key = `agent-tools:${throttleKey('', request)}`;
    if (await tooManyAttempts(key, 60)) return abort(429);
    await hit(key, 60);

    const data = await validate(await readBody(request), {
        call_id: ['required', 'integer'],
        subject: ['required', 'string', 'max:255'],
        body: ['required', 'string'],
    });

    const call = await prisma.call.findUnique({
        where: { id: BigInt(data.call_id) },
        include: { contacts: true },
    });

    if (!call || !agentTokenMatches(Number(call.client_id), request.headers.get('x-agent-token'))) {
        return abort(401);
    }

    const to = call.contacts?.email;
    if (!to) return NextResponse.json({ ok: false, error: 'no_recipient' }, { status: 422 });

    const msg = await sendEmailMessage(
        call.client_id,
        to,
        data.subject,
        data.body,
        { name: call.contacts?.name ?? 'there' },
        { contact_id: call.contact_id, call_id: call.id, sent_by: 'agent' },
    );

    return NextResponse.json({ ok: msg.status !== 'failed', message_id: Number(msg.id) });
});
