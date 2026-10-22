#!/usr/bin/env node
/**
 * Writes an APP_KEY into .env when one is missing.
 *
 * APP_KEY encrypts every credential the app stores (Twilio, OpenAI, ElevenLabs,
 * SMTP, payment gateways, SIP) and signs the in-call agent's callback tokens,
 * so a working install must have one. Run it directly:
 *
 *   npm run key:generate          # write a key only if .env has none
 *   npm run key:generate -- --force   # rotate (existing credentials become unreadable)
 *
 * `npm run db:seed` calls the same routine, so a normal install never has to
 * think about it.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ENV_PATH = path.resolve(process.cwd(), '.env');

export function newAppKey() {
    return `base64:${crypto.randomBytes(32).toString('base64')}`;
}

/**
 * Ensures .env carries an APP_KEY. Returns { key, created } — `created` is false
 * when a key was already present and left untouched.
 */
export function ensureAppKey({ force = false, quiet = false } = {}) {
    const log = (msg) => { if (!quiet) console.log(msg); };

    if (!fs.existsSync(ENV_PATH)) {
        const key = newAppKey();
        log('  .env not found — copy .env.example to .env first, then add:');
        log(`  APP_KEY="${key}"`);
        return { key, created: false };
    }

    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    const line = /^[ \t]*APP_KEY[ \t]*=[ \t]*(.*)$/m;
    const match = raw.match(line);
    const current = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';

    if (current && !force) {
        log('  APP_KEY already set — nothing to do. Use --force to rotate it.');
        return { key: current, created: false };
    }

    const key = newAppKey();
    const next = match
        ? raw.replace(line, `APP_KEY="${key}"`)
        : `${raw.replace(/\n*$/, '\n')}\nAPP_KEY="${key}"\n`;

    fs.writeFileSync(ENV_PATH, next);

    if (current && force) {
        log('  APP_KEY rotated. Credentials saved under the previous key can no');
        log('  longer be decrypted — re-enter them from the admin panel.');
    } else {
        log('  APP_KEY generated and written to .env');
    }
    return { key, created: true };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('generate-key.mjs');
if (invokedDirectly) {
    ensureAppKey({ force: process.argv.includes('--force') });
}
