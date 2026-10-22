import 'server-only';

import config from '@/lib/config';
import { escapeXml } from '@/lib/webhooks/twiml';

/** Plivo XML equivalents of the TwiML helpers. */

export function plivoXml(body) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
    });
}

export function speak(text) {
    return `<Speak>${escapeXml(text)}</Speak>`;
}

export function getInputXml(callId, text) {
    const action = `${String(config.app.url).replace(/\/+$/, '')}/webhooks/plivo/gather?c=${callId}`;

    return (
        `<GetInput action="${escapeXml(action)}" method="POST" inputType="speech" ` +
        `speechEndTimeout="auto" redirect="true">${speak(text)}</GetInput>`
    );
}
