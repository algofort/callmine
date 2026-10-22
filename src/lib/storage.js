import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Named filesystem disks: where uploads and generated files live.
 *
 *   'local'  -> storage/app          (private: KB uploads, KYC documents)
 *   'public' -> storage/app/public   (served at /storage/*)
 */

const ROOT = path.join(process.cwd(), 'storage', 'app');

function diskRoot(disk) {
    return disk === 'public' ? path.join(ROOT, 'public') : ROOT;
}

export function diskPath(relative, disk = 'local') {
    const safe = String(relative).replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(diskRoot(disk), safe);
}

/** `$file->store($directory, $disk)` — random filename, returns the relative path. */
export async function storeFile(file, directory, disk = 'local') {
    const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
    const name = `${crypto.randomBytes(20).toString('hex')}.${ext}`;
    const relative = `${String(directory).replace(/^\/+|\/+$/g, '')}/${name}`;

    const full = diskPath(relative, disk);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, Buffer.from(await file.arrayBuffer()));

    return relative;
}

/** `$file->storeAs($directory, $name, $disk)` */
export async function storeFileAs(file, directory, name, disk = 'local') {
    const relative = `${String(directory).replace(/^\/+|\/+$/g, '')}/${name}`;
    const full = diskPath(relative, disk);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, Buffer.from(await file.arrayBuffer()));
    return relative;
}

export async function readFile(relative, disk = 'local') {
    try {
        return await fs.readFile(diskPath(relative, disk));
    } catch {
        return null;
    }
}

export async function deleteFile(relative, disk = 'local') {
    if (!relative) return false;
    try {
        await fs.unlink(diskPath(relative, disk));
        return true;
    } catch {
        return false;
    }
}

export async function fileExists(relative, disk = 'local') {
    try {
        await fs.access(diskPath(relative, disk));
        return true;
    } catch {
        return false;
    }
}
