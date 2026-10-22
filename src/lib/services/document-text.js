import 'server-only';

import { unzipSync } from 'node:zlib';
import { readFile } from '@/lib/storage';

/**
 * Port of App\Services\Knowledge\DocumentTextExtractor. Returns null when
 * nothing usable can be read, so the caller marks the item failed rather than
 * "ready" — an item that looks usable but contributes nothing to a call is the
 * bug the original guarded against.
 */

const MAX_CHARS = 100000;

export async function extractText(storagePath, extension) {
    const ext = String(extension ?? '').toLowerCase();

    let text = null;
    if (ext === 'txt') text = await fromPlainText(storagePath);
    else if (ext === 'pdf') text = await fromPdf(storagePath);
    else if (ext === 'docx') text = await fromDocx(storagePath);
    else if (ext === 'doc') text = await fromLegacyDoc(storagePath);

    return normalize(text);
}

async function fromPlainText(path) {
    const buf = await readFile(path);
    return buf ? buf.toString('utf8') : null;
}

/**
 * Minimal PDF text extraction: inflate each FlateDecode stream and pull the
 * strings out of the text-showing operators. Scanned/image-only PDFs yield
 * nothing, which is the documented "failed" case.
 */
async function fromPdf(path) {
    const buf = await readFile(path);
    if (!buf) return null;

    try {
        const chunks = [];
        let index = 0;

        while (index < buf.length) {
            const start = buf.indexOf('stream', index);
            if (start === -1) break;
            const end = buf.indexOf('endstream', start);
            if (end === -1) break;

            let from = start + 6;
            if (buf[from] === 0x0d) from++;
            if (buf[from] === 0x0a) from++;

            const raw = buf.subarray(from, end);
            try {
                chunks.push(unzipSync(raw).toString('latin1'));
            } catch {
                chunks.push(raw.toString('latin1'));
            }
            index = end + 9;
        }

        const content = chunks.join('\n');
        const out = [];
        for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
            out.push(match[0].slice(1, -1).replace(/\\([()\\])/g, '$1'));
        }
        for (const match of content.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
            const hex = match[1].replace(/\s+/g, '');
            let s = '';
            for (let i = 0; i + 1 < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
            out.push(s);
        }

        return out.join(' ');
    } catch (e) {
        console.warn('[kb] PDF extraction failed:', e?.message, { path });
        return null;
    }
}

/** A .docx is a zip; the body text lives in word/document.xml. */
async function fromDocx(path) {
    const buf = await readFile(path);
    if (!buf) return null;

    try {
        const xml = readZipEntry(buf, 'word/document.xml');
        if (!xml) return null;
        return xml
            .replace(/<w:p[^>]*>/g, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    } catch (e) {
        console.warn('[kb] DOCX extraction failed:', e?.message, { path });
        return null;
    }
}

/** Legacy .doc — salvage the printable ASCII runs. */
async function fromLegacyDoc(path) {
    const buf = await readFile(path);
    if (!buf) return null;

    const runs = buf.toString('latin1').match(/[\x20-\x7E\r\n\t]{6,}/g);
    return runs ? runs.join(' ') : null;
}

/** Reads one entry out of a ZIP container without an external dependency. */
function readZipEntry(buf, wanted) {
    let index = 0;
    while (index < buf.length - 4) {
        if (buf.readUInt32LE(index) !== 0x04034b50) {
            index++;
            continue;
        }

        const method = buf.readUInt16LE(index + 8);
        const compressedSize = buf.readUInt32LE(index + 18);
        const nameLength = buf.readUInt16LE(index + 26);
        const extraLength = buf.readUInt16LE(index + 28);
        const name = buf.subarray(index + 30, index + 30 + nameLength).toString('utf8');

        const dataStart = index + 30 + nameLength + extraLength;

        if (name === wanted && compressedSize > 0) {
            const data = buf.subarray(dataStart, dataStart + compressedSize);
            if (method === 0) return data.toString('utf8');
            try {
                return require('node:zlib').inflateRawSync(data).toString('utf8');
            } catch {
                return null;
            }
        }

        index = dataStart + compressedSize;
        if (compressedSize === 0) index = dataStart; // streamed entry — scan forward
    }
    return null;
}

function normalize(text) {
    if (!text) return null;
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (clean === '') return null;
    return clean.slice(0, MAX_CHARS);
}
