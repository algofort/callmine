import 'server-only';

import * as twilio from './twilio';
import * as plivo from './plivo';
import config from '@/lib/config';
import { telephonyKeyFor } from '@/lib/services/integrations';

/** Port of App\Services\Telephony\TelephonyManager. */

const DRIVERS = { twilio, plivo };

export function driver(provider) {
    return DRIVERS[provider] ?? twilio;
}

export function defaultDriver() {
    return driver(config.telephony.default);
}

/** The driver an agent's engine maps to (). */
export function driverForEngine(engine) {
    return driver(telephonyKeyFor(engine));
}

export async function configured(provider) {
    return driver(provider).isConfigured();
}

export { twilio, plivo };
