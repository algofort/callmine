import { handler } from '@/lib/guards';
import { abort } from '@/lib/http';
import { hasValidSignature } from '@/lib/auth/verification';
import { audioFor } from '@/lib/services/call-speech';

/**
 * GET /webhooks/tts/{hash}.mp3.
 * The carrier fetches this with a plain unsigned GET, so it cannot sit behind
 * the Twilio signature check; a signed URL guards it instead.
 */
export const GET = handler(async (request, { params }) => {
    if (!hasValidSignature(request.url)) return abort(403, 'Invalid signature.');

    const { hash } = await params;
    const clean = String(hash).replace(/\.mp3$/, '');

    if (!/^[a-f0-9]{64}$/.test(clean)) return abort(404);

    const audio = await audioFor(clean);
    if (!audio) return abort(404);

    return new Response(audio, {
        status: 200,
        headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(audio.length),
            'Cache-Control': 'public, max-age=86400',
        },
    });
});
