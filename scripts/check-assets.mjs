import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Check the artifact before restart, then the public proxy after restart.
export async function checkBuild(directory = '.next') {
    const files = new Set();
    function collect(value) {
        if (typeof value === 'string' && value.startsWith('static/')) files.add(value);
        else if (Array.isArray(value)) value.forEach(collect);
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    }
    await fs.access(path.join(directory, 'BUILD_ID'));
    for (const manifest of ['build-manifest.json', 'app-build-manifest.json']) {
        collect(JSON.parse(await fs.readFile(path.join(directory, manifest), 'utf8')));
    }
    if (!files.size) throw new Error('No static assets found in build manifests.');
    const errors = [];
    for (const file of files) {
        try {
            const stat = await fs.stat(path.join(directory, file));
            if (!stat.isFile() || !stat.size) errors.push(`Empty or invalid asset: ${file}`);
        } catch {
            errors.push(`Missing build asset: ${file}`);
        }
    }
    return { checked: files.size, errors };
}

export async function checkDeployment(pageUrl) {
    const page = await fetch(pageUrl, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
    if (!page.ok) throw new Error(`Page returned HTTP ${page.status}`);
    if (!(page.headers.get('content-type') || '').includes('text/html')) {
        throw new Error('Expected an HTML page at the deployment URL.');
    }
    const html = await page.text();
    const assets = new Set();
    for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
        const attribute = /\b(?:src|href)\s*=\s*["']([^"']+)["']/i.exec(tag[0]);
        if (!attribute) continue;
        const url = new URL(attribute[1].replaceAll('&amp;', '&'), page.url);
        if (url.origin === new URL(page.url).origin && url.pathname.includes('/_next/static/') && /\.(?:js|css)$/.test(url.pathname)) {
            assets.add(url.href);
        }
    }
    if (!assets.size) throw new Error('No Next.js JS/CSS assets found; check the URL/proxy.');
    const errors = [];
    const urls = [...assets];
    for (let index = 0; index < urls.length; index += 4) {
        await Promise.all(urls.slice(index, index + 4).map(async (url) => {
            try {
                const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
                const type = response.headers.get('content-type') || '';
                const validType = new URL(url).pathname.endsWith('.css') ? /text\/css/i.test(type) : /javascript|ecmascript/i.test(type);
                await response.body?.cancel();
                if (!response.ok || !validType || response.headers.get('content-length') === '0') {
                    errors.push(`${url}: HTTP ${response.status}, ${type || 'no content type'}`);
                }
            } catch (error) {
                errors.push(`${url}: ${error.message}`);
            }
        }));
    }
    return { checked: assets.size, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try {
        const target = process.argv[2];
        const result = target?.startsWith('https://') || target?.startsWith('http://')
            ? await checkDeployment(target)
            : await checkBuild(target || '.next');
        result.errors.forEach((error) => console.error(error));
        console.log(`Checked ${result.checked} assets; ${result.errors.length} failure(s).`);
        if (result.errors.length) process.exitCode = 1;
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
