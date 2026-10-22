import 'server-only';

import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { fileExists, readFile, storeFileAs } from '@/lib/storage';
import { signedUrl } from '@/lib/auth/verification';
import { synthesize } from '@/lib/services/elevenlabs';

/**
 * Port of App\Services\Voice\CallSpeechService — synthesizes an agent line,
 * caches the mp3 on disk, and hands the carrier a short-lived signed URL.
 */

const OUTPUT_FORMAT = 'mp3_22050_32';
const LATENCY_MODE = 4;

export async function audioUrl(call, text) {
    try {
        const voiceId = await voiceIdFor(call);
        if (!voiceId || String(text).trim() === '') return null;

        const model = config.voice.tts_model;
        const hash = crypto
            .createHash('sha256')
            .update([voiceId, model, OUTPUT_FORMAT, text].join('|'))
            .digest('hex');

        const path = `tts/${hash}.mp3`;

        if (!(await fileExists(path))) {
            const audio = await synthesize(text, voiceId, await keyFor(call), {
                latency: LATENCY_MODE,
                output_format: OUTPUT_FORMAT,
            });

            if (!audio) {
                console.warn('Call TTS synthesis failed; falling back to carrier voice.', {
                    call_id: String(call.id),
                    voice_id: voiceId,
                });
                return null;
            }

            await storeFileAs(new Blob([audio]), 'tts', `${hash}.mp3`, 'local');
        }

        // The carrier fetches this with a plain unsigned GET, so the signature is
        // what keeps the endpoint from being an open TTS proxy.
        return signedUrl(`/webhooks/tts/${hash}.mp3`, {}, 3600);
    } catch (e) {
        console.warn('Call TTS URL generation failed; falling back to carrier voice:', e?.message, {
            call_id: String(call.id),
        });
        return null;
    }
}

export async function audioFor(hash) {
    return readFile(`tts/${hash}.mp3`);
}

async function voiceIdFor(call) {
    if (call.agent_id) {
        const agent = await prisma.agent.findUnique({
            where: { id: call.agent_id },
            include: { voices: { select: { external_id: true } } },
        });
        if (agent?.voices?.external_id) return agent.voices.external_id;
    }
    return config.voice.default_voice_id;
}

async function keyFor(call) {
    const keyId = call.meta?.key_id;
    if (!keyId) return null;
    return prisma.elevenLabsKey.findUnique({ where: { id: BigInt(keyId) } }).catch(() => null);
}
