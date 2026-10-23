import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkBuild, checkDeployment } from './check-assets.mjs';

test('detects an incomplete build before it is served', async (t) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'callmine-assets-'));
    t.after(async () => {
        const target = path.resolve(directory);
        assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
        assert.ok(path.basename(target).startsWith('callmine-assets-'));
        await fs.rm(target, { recursive: true, force: true });
    });
    await fs.mkdir(path.join(directory, 'static/chunks'), { recursive: true });
    await fs.writeFile(path.join(directory, 'BUILD_ID'), 'test-release');
    await fs.writeFile(path.join(directory, 'build-manifest.json'), '{}');
    await fs.writeFile(path.join(directory, 'app-build-manifest.json'), JSON.stringify({ pages: { '/page': ['static/chunks/example.js'] } }));
    assert.equal((await checkBuild(directory)).errors.length, 1);
    await fs.writeFile(path.join(directory, 'static/chunks/example.js'), 'console.log(1)');
    assert.equal((await checkBuild(directory)).errors.length, 0);
});

test('checks prefixed public assets and rejects 404 and HTML fallbacks', async (t) => {
    let assetMode = 'ok';
    const server = http.createServer((request, response) => {
        if (request.url === '/callmine/') {
            response.setHeader('Content-Type', 'text/html');
            response.end('<script src="/callmine/_next/static/chunks/test.js"></script>');
        } else if (request.url === '/callmine/_next/static/chunks/test.js') {
            response.statusCode = assetMode === 'missing' ? 404 : 200;
            response.setHeader('Content-Type', assetMode === 'ok' ? 'application/javascript' : 'text/html');
            response.end(assetMode === 'ok' ? 'console.log(1)' : '<html>fallback</html>');
        } else {
            response.statusCode = 404;
            response.end();
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
    const url = `http://127.0.0.1:${server.address().port}/callmine/`;
    assert.equal((await checkDeployment(url)).errors.length, 0);
    assetMode = 'missing';
    assert.match((await checkDeployment(url)).errors[0], /HTTP 404/);
    assetMode = 'fallback';
    assert.match((await checkDeployment(url)).errors[0], /HTTP 200, text\/html/);
});
