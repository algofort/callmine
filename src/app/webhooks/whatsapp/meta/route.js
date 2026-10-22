import crypto from 'node:crypto';
import { handler } from '@/lib/guards';
import config from '@/lib/config';
import { queryParams } from '@/lib/http';
import { messagingSettings } from '@/lib/services/messaging';
import { processInboundWhatsApp } from '@/lib/services/inbound-whatsapp';

/** GET /webhooks/whatsapp/meta */
export const GET = handler(async (request) => {
    const params = queryParams(request);
    const settings = await messagingSettings();
    const token = String(settings.verify_token || config.messaging.meta.verify_token || '');

    if (
        token !== '' &&
        params.hub_mode === 'subscribe' &&
        timingSafeEqual(token, String(params.hub_verify_token ?? ''))
    ) {
        return new Response(String(params.hub_challenge ?? ''), { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
});

/** POST /webhooks/whatsapp/meta */
export const POST = handler(async (request) => {
    const raw = await request.text();

    const settings = await messagingSettings();
    const secret = String(settings.meta_app_secret || config.messaging.meta.app_secret || '');

    if (secret === '') {
        console.warn('WhatsApp webhook rejected — no Meta app secret configured.');
        return new Response('Invalid signature', { status: 403 });
    }

    const header = request.headers.get('x-hub-signature-256') ?? '';
    if (!header.startsWith('sha256=')) return new Response('Invalid signature', { status: 403 });

    const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
    if (!timingSafeEqual(expected, header)) return new Response('Invalid signature', { status: 403 });

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        return new Response('Invalid payload', { status: 400 });
    }

    await processInboundWhatsApp(payload);

    return new Response('', { status: 200 });
});

function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}
