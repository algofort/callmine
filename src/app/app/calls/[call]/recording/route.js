import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler, resolveClientId } from '@/lib/guards';
import { abort } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { twilio } from '@/lib/services/telephony';

/**
 * GET /app/calls/{call}/recording.
 * Twilio recording URLs need Basic auth, so the audio is piped through the app;
 * non-Twilio (SIP engine) URLs are public and just redirect.
 */
export const GET = handler(async (request, { params }) => {
    const user = await currentUser();
    if (!user) return abort(401);
    const clientId = await resolveClientId(user);

    const { call: id } = await params;
    const call = await prisma.call.findUnique({ where: { id: BigInt(id) } });
    if (!call) return abort(404);
    if (String(call.client_id) !== String(clientId)) return abort(403);
    if (!call.recording_url) return abort(404);

    if (!String(call.recording_url).includes('twilio.com')) {
        return NextResponse.redirect(call.recording_url);
    }

    let sid = call.recording_sid;
    if (!sid) {
        // Derive the recording SID from the stored URL when it was not persisted.
        const match = String(call.recording_url).match(/Recordings\/(RE[a-f0-9]+)/i);
        sid = match?.[1] ?? null;
    }

    const audio = sid ? await twilio.fetchRecording(sid) : null;
    if (!audio) return abort(404, 'Recording unavailable.');

    return new NextResponse(audio.body, {
        status: 200,
        headers: {
            'Content-Type': audio.content_type,
            'Content-Disposition': `inline; filename="call-${Number(call.id)}.mp3"`,
            'Cache-Control': 'private, max-age=3600',
        },
    });
});
