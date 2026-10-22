import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { gateClient, handler } from '@/lib/guards';
import { abort } from '@/lib/http';
import { KEY_STATUS, synthesize } from '@/lib/services/elevenlabs';

/** POST /app/voices/{voice}/preview */
export const POST = handler(async (request, { params }) => {
    const gate = await gateClient({ routeName: 'client.voices.preview' });
    if (gate.response) return gate.response;

    const { voice: id } = await params;
    const voice = await prisma.voice.findUnique({ where: { id: BigInt(id) } });
    if (!voice) return abort(404);

    if (voice.preview_url) return NextResponse.json({ url: voice.preview_url });

    const key = await prisma.elevenLabsKey.findFirst({ where: { status: KEY_STATUS.ACTIVE } });
    const audio = voice.external_id
        ? await synthesize(config.voice.preview_text, voice.external_id, key)
        : null;

    if (!audio) {
        return NextResponse.json(
            {
                message:
                    'Preview unavailable. Configure an active ElevenLabs key in the admin panel, then sync voices.',
            },
            { status: 422 },
        );
    }

    return NextResponse.json({ data: `data:audio/mpeg;base64,${audio.toString('base64')}` });
});
