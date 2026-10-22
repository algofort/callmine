import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { abort, readBody, validate } from '@/lib/http';
import { agentTokenMatches } from '@/lib/webhooks/agent-token';
import { sendWhatsAppText } from '@/lib/services/messaging';
import { hit, throttleKey, tooManyAttempts } from '@/lib/rate-limit';

/** POST /webhooks/agent/send-whatsapp */
export const POST = handler(async (request) => {
    const key = `agent-tools:${throttleKey('', request)}`;
    if (await tooManyAttempts(key, 60)) return abort(429);
    await hit(key, 60);

    const data = await validate(await readBody(request), {
        call_id: ['required', 'integer'],
        body: ['required', 'string', 'max:4000'],
    });

    const call = await prisma.call.findUnique({
        where: { id: BigInt(data.call_id) },
        include: { contacts: true },
    });

    if (!call || !agentTokenMatches(Number(call.client_id), request.headers.get('x-agent-token'))) {
        return abort(401);
    }

    if (!call.contacts?.phone) {
        return NextResponse.json({ ok: false, error: 'no_contact_phone' }, { status: 422 });
    }

    const account = await prisma.whatsAppAccount.findFirst({ where: { client_id: call.client_id } });
    if (!account) {
        return NextResponse.json({ ok: false, error: 'no_whatsapp_account' }, { status: 422 });
    }

    const msg = await sendWhatsAppText(account, call.contacts.phone, data.body, {
        call_id: call.id,
        sent_by: 'agent',
        contact_id: call.contact_id,
    });

    return NextResponse.json({ ok: msg.status !== 'failed', message_id: Number(msg.id) });
});
