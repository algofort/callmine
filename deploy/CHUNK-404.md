# Missing JavaScript chunk on the VPS

On 2026-10-23 the public homepage at https://products.algofort.com/callmine/
returned HTML referring to `820-9ce0c7b47b82faaa.js`, while that file returned
404 and other referenced JS files returned 200. Fresh HTML has the broken
reference, so clearing one browser's cache is not a sufficient repair.

This is consistent with incomplete/mixed build files or a proxy serving static
assets from a different release. It is not enough to pull Git: .next is generated
on the VPS and excluded from Git. The exact server cause needs the VPS config.

## Checks (from the existing VPS project directory)

```bash
pwd
pm2 list
git status --short
cat next.config.mjs
npm run check:assets
npm run check:assets -- https://products.algofort.com/callmine/
```

`check:assets` validates every asset referenced by both production manifests.
With a URL, it checks the JS/CSS referenced by that public page, including the
actual /callmine prefix. A 200 HTML fallback for a JS file is also a failure.
It does not verify authenticated pages or every lazy import over HTTP.

## Repair after preserving VPS edits

Do not overwrite uncommitted VPS fixes (especially next.config.mjs), .env or the
database. Preserve/reconcile those edits before pulling. Identify the actual PM2
app and worker names using `pm2 list`; do not use `pm2 stop all` on a shared VPS.

Stop the CallMine worker and app before replacing their build. Keep the previous
.next directory as a rollback backup, run `npm ci` and `npm run build`, then
restart the app with its existing PM2 configuration and production environment.
Check both local upstream and public URL before starting the worker again.
Do not seed/reset the database, rotate APP_KEY or run destructive schema changes
for a chunk error. If build fails, restore the old build before restarting.

If the local upstream passes but the public URL fails, inspect the Nginx
`/callmine/_next/` location and any alias/cache: HTML and static files must come
from the same build. Preserve other apps on products.algofort.com. A root-domain
Nginx template must not replace the existing shared-domain configuration.

The config now supports NEXT_PUBLIC_BASE_PATH=/callmine. Without an explicit
value it derives the pathname from NEXT_PUBLIC_APP_URL or APP_URL, retaining
domain-root behavior locally. basePath also prefixes Next static assets, so an
identical assetPrefix is unnecessary. This only configures Next routing/assets;
it is not an audit of every application URL for subdirectory hosting. Next.js
basePath is a BUILD-TIME option; changing it requires a rebuild. Do not strip
/callmine in Nginx or modify authentication routes blindly.

The supplied PM2 list for root did not show CallMine. Determine the actual owner
and process before any stop/rebuild (run these individually):

```bash
stat -c '%U' /opt/callmine
systemctl is-active callmine-app callmine-worker
ps -eo user,pid,args | grep -E 'next start|callmine|worker.mjs' | grep -v grep
```

Use Git as the project owner rather than globally disabling ownership checks.
For example, if the owner is callmine:

```bash
sudo -u callmine -H git -C /opt/callmine status --short
sudo -u callmine -H pm2 list
```

Preserve VPS edits before pulling. Build with NEXT_PUBLIC_BASE_PATH=/callmine
and the existing real APP_URL/NEXT_PUBLIC_APP_URL, and verify after restart:

```bash
NEXT_PUBLIC_BASE_PATH=/callmine npm run build
npm run check:assets -- https://products.algofort.com/callmine/
```

Once fixed, reload older open browser tabs. Do not disable immutable caching for
hashed assets globally or hide the error with an infinite reload loop.
