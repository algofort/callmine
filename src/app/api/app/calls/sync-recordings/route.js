import prisma from '@/lib/prisma';
import { gateClient, handler } from '@/lib/guards';
import { back } from '@/lib/http';
import { defaultDriver } from '@/lib/services/telephony';

/** POST /app/calls/sync-recordings */
export const POST = handler(async () => {
    const gate = await gateClient({ routeName: 'client.calls.sync-recordings' });
    if (gate.response) return gate.response;

    const telephony = defaultDriver();
    if (!(await telephony.isConfigured())) return back({ error: 'Twilio is not configured.' });

    const recordings = await telephony.listRecordings();
    let updated = 0;

    for (const [callSid, rec] of Object.entries(recordings)) {
        const result = await prisma.call.updateMany({
            where: {
                client_id: BigInt(gate.clientId),
                twilio_call_sid: callSid,
                recording_url: null,
            },
            data: { recording_url: rec.url, recording_sid: rec.sid, updated_at: new Date() },
        });
        updated += result.count;
    }

    return back({ success: `${updated} recordings synced.` });
});
