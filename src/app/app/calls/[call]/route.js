import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler, requireClientPage } from '@/lib/guards';
import { abort } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { resolveClientId } from '@/lib/guards';

/** GET /app/calls/{call} (JSON, fetched by axios). */
export const GET = handler(async (request, { params }) => {
    const user = await currentUser();
    if (!user) return abort(401);
    const clientId = await resolveClientId(user);

    const { call: id } = await params;
    const call = await prisma.call.findUnique({ where: { id: BigInt(id) } });
    if (!call) return abort(404);
    if (String(call.client_id) !== String(clientId)) return abort(403);

    return NextResponse.json({
        id: Number(call.id),
        transcript: call.transcript,
        summary: call.summary,
        sentiment: call.sentiment,
        qualification: call.qualification,
        // Proxy recordings so the browser never hits Twilio's Basic-auth URL directly.
        recording_url: call.recording_url ? `/app/calls/${Number(call.id)}/recording` : null,
        duration_seconds: call.duration_seconds,
        outcome: call.outcome,
    });
});
