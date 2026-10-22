import 'server-only';

/** The SIP engines and trunk providers the dialer can place calls through. */

export const SIP_ENGINES = { ELEVENLABS: 'elevenlabs', OPENAI: 'openai' };

/** Preconfigured SIP provider templates (auto-filled defaults when adding a trunk). */
export const SIP_PROVIDERS = {
    twilio: { name: 'Twilio', sip_host: 'your-domain.pstn.twilio.com', sip_port: 5060, transport: 'tls' },
    plivo: { name: 'Plivo', sip_host: 'phone.plivo.com', sip_port: 5060, transport: 'udp' },
    telnyx: { name: 'Telnyx', sip_host: 'sip.telnyx.com', sip_port: 5060, transport: 'tls' },
    vonage: { name: 'Vonage', sip_host: 'sip.nexmo.com', sip_port: 5060, transport: 'tls' },
    bandwidth: { name: 'Bandwidth', sip_host: 'gw.bandwidth.com', sip_port: 5060, transport: 'udp' },
    exotel: { name: 'Exotel', sip_host: 'sip.exotel.com', sip_port: 5060, transport: 'udp' },
    didww: { name: 'DIDWW', sip_host: 'sip.didww.com', sip_port: 5060, transport: 'udp' },
    zadarma: { name: 'Zadarma', sip_host: 'sip.zadarma.com', sip_port: 5060, transport: 'udp' },
    cloudonix: { name: 'Cloudonix', sip_host: 'sip.cloudonix.io', sip_port: 5060, transport: 'tls' },
    ringcentral: { name: 'RingCentral', sip_host: 'sip.ringcentral.com', sip_port: 5060, transport: 'tls' },
    sinch: { name: 'Sinch', sip_host: 'sip.sinch.com', sip_port: 5060, transport: 'tls' },
    infobip: { name: 'Infobip', sip_host: 'sip.infobip.com', sip_port: 5060, transport: 'tls' },
    generic: { name: 'Generic SIP', sip_host: '', sip_port: 5060, transport: 'udp' },
};

/** ElevenLabsSipEngine */
const elevenlabsEngine = {
    key: () => SIP_ENGINES.ELEVENLABS,
    name: () => 'ElevenLabs SIP',
    supportsOutbound: () => true,
    supportsRecording: () => true,
    // Per-number provisioning against the ElevenLabs SIP trunk. Real provisioning
    // needs ElevenLabs SIP credentials; otherwise the number is recorded locally.
    provisionNumber: async () => ({ ok: true }),
    // ElevenLabs inbound is trunk-scoped; there is no shared HMAC to verify.
    verifyWebhook: async () => true,
};

/** OpenAiSipEngine */
const openaiEngine = {
    key: () => SIP_ENGINES.OPENAI,
    name: () => 'OpenAI Realtime SIP',
    supportsOutbound: () => false,
    supportsRecording: () => false,
    provisionNumber: async () => ({ ok: true }),
    verifyWebhook: async () => true,
};

const ENGINES = { elevenlabs: elevenlabsEngine, openai: openaiEngine };

export function sipEngineForKey(key) {
    return ENGINES[key] ?? null;
}

export function sipEngineForTrunk(trunk) {
    return sipEngineForKey(trunk?.engine ?? SIP_ENGINES.ELEVENLABS);
}

export function allSipEngines() {
    return [elevenlabsEngine, openaiEngine].map((e) => ({
        key: e.key(),
        name: e.name(),
        outbound: e.supportsOutbound(),
        recording: e.supportsRecording(),
    }));
}
