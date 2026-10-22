# Contabo deployment handoff

Prepared for an Ubuntu 24.04 LTS VPS, Node.js 24, MariaDB, Nginx and systemd.
This is a deployment template, not a completed or Linux-tested deployment.
Start with 2 vCPU / 4 GB RAM or more for a small pilot; load test real calling
before promising concurrent-call capacity. AI/telephony API charges are separate.

## Access needed

- VPS public IP, SSH port, sudo-capable username and SSH key access.
- Domain/subdomain and DNS access: point its A record at the VPS. Only add AAAA
  if IPv6 is configured and reachable.
- Private repository access: use a repository-scoped read-only GitHub deploy key.
- Owner email, initial admin/client emails, SMTP and selected API credentials.
- Keep the repository private because it contains purchased application source.

Use placeholders below only after replacing them. Never commit `.env`, database
dumps, uploads, private keys or provider secrets. No VPS changes have been made.

## Server preparation (sudo administrator)

Install Node.js 24 from a trusted source so `/usr/bin/node` is available, plus:

```bash
sudo apt update
sudo apt install -y git nginx mariadb-server certbot python3-certbot-nginx build-essential
sudo adduser --disabled-password --gecos '' callmine
sudo install -d -o callmine -g callmine /opt/callmine
```

Allow the actual SSH port before enabling a firewall. Allow HTTP/HTTPS; keep
3000 and 3306 private. Configure the Contabo firewall too if one is enabled.
Clone the private repository as `callmine` using the scoped deploy key:

```bash
sudo -iu callmine
git clone git@github.com:algofort/callmine.git /opt/callmine
cd /opt/callmine
cp deploy/.env.production.example .env
chmod 600 .env
```

Create a new MariaDB database and application user with privileges limited to
that database. Use `utf8mb4` / `utf8mb4_unicode_ci`. Set `DATABASE_URL` in `.env`.
Do not reuse the local root/blank password configuration.

In a separate sudo administrator session, open `sudo mariadb` and run (replace
the password first; use a generated alphanumeric password to simplify quoting):

```sql
CREATE DATABASE callmine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'callmine'@'127.0.0.1' IDENTIFIED BY 'REPLACE_STRONG_DATABASE_PASSWORD';
GRANT ALL PRIVILEGES ON callmine.* TO 'callmine'@'127.0.0.1';
```

Edit `.env`: replace the domain in all URLs, all REPLACE_* fields and sender
email. Generate AUTH_SECRET and CRON_SECRET separately with
`openssl rand -hex 32`. Generate APP_KEY using the existing key script after
removing its REPLACE_* placeholder (leave APP_KEY empty first):

```bash
npm ci
npm run key:generate
```

For a NEW EMPTY database only:

```bash
npx prisma db push
node --env-file=.env prisma/seed.mjs
```

The repository currently uses a Prisma schema without migration history.
`db:migrate` is not an initialization substitute. Do not use `--accept-data-loss`.
If migrating existing data instead, transfer a private DB dump and storage/
separately and preserve the ORIGINAL APP_KEY to decrypt saved credentials.
Do not run initial seeding against an existing production database casually.

Build after the production environment is configured:

```bash
npm run build
mkdir -p storage/app/public
exit
```

The seed creates an admin AND a client. Set both strong passwords and real owner
emails before seeding; disable/remove any unnecessary test client before launch.
Never expose the vendor's default demo credentials.

## Web server and services (sudo administrator)

Edit `/opt/callmine/deploy/nginx.conf` with the real domain before copying.

```bash
sudo cp /opt/callmine/deploy/callmine-*.service /etc/systemd/system/
sudo cp /opt/callmine/deploy/nginx.conf /etc/nginx/sites-available/callmine
sudo ln -s /etc/nginx/sites-available/callmine /etc/nginx/sites-enabled/callmine
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d YOUR_REAL_DOMAIN
sudo systemctl daemon-reload
sudo systemctl enable --now callmine-app
```

Verify HTTPS and initial login, configure providers and confirm no unintended
scheduled campaigns exist, then start the scheduler:

```bash
sudo systemctl enable --now callmine-worker
sudo systemctl status callmine-app callmine-worker
sudo journalctl -u callmine-app -u callmine-worker -n 100 --no-pager
```

Use exactly one scheduler: these services already run the campaign worker. Do
not add a duplicate cron job. The worker uses APP_URL and must reach public HTTPS.
If Node is installed outside `/usr/bin/node`, fix BOTH unit ExecStart paths.

## Provider configuration and checks

- Twilio: Account SID, Auth Token, voice-capable number; inbound voice webhook
  `https://YOUR_REAL_DOMAIN/webhooks/twilio/voice` using POST. Status/recording
  callback paths are in the production environment template.
- OpenAI: API key and an available model supported by the chosen calling path.
- ElevenLabs is optional: when selected, configure voice pool/key/voice and use
  `CALL_DEFAULT_ENGINE=elevenlabs_twilio`, `ELEVENLABS_ENABLED=true`.
- SMTP for real email; payment gateways and WhatsApp only when needed.
- Test owner login, uploads, inbound/outbound call with consent, recording/TTS
  callbacks, one scheduled test campaign, scheduler heartbeat and email.
- Review `npm audit` findings and production build output before public launch.
  No real calls or provider billing were tested during local preparation.

Local dependency audit on 2026-10-22 (`npm audit --omit=dev`) reported 11 affected
packages: 1 critical, 9 high and 1 moderate. Upload preparation does not resolve
these advisories. Review fixes and retest before exposing a production service;
do not blindly run `npm audit fix --force` (some proposed changes are major).

## Persistence, backups and updates

`storage/` contains private documents and generated audio; never expose the whole
directory through Nginx. Translation edits also write `src/locales/`; preserve
them across updates. Back up MariaDB, storage/, locale customizations and `.env`
(especially APP_KEY) to encrypted storage off the VPS, and test restoration.

Before upgrades, back up and stop the worker. Pull the intended release, run
`npm ci`, review/apply schema changes deliberately, build, restart the app, verify
it, then restart the worker. Do not seed accounts or regenerate APP_KEY on each
deployment. Take a VPS snapshot before major changes.
