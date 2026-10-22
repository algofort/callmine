import { gateClient, handler } from '@/lib/guards';
import { back, readBody } from '@/lib/http';
import { importCsv } from '@/lib/domain/contacts';

/** POST /app/contacts/import */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.contacts.import' });
    if (gate.response) return gate.response;

    const body = await readBody(request);
    const file = body.file;

    if (!(file instanceof File)) return back({ error: 'A CSV file is required.' });
    if (file.size > 20480 * 1024) return back({ error: 'The file may not be greater than 20480 kilobytes.' });

    const result = await importCsv(gate.clientId, Buffer.from(await file.arrayBuffer()));

    let message = `${result.inserted} added, ${result.merged} merged, ${result.skipped} skipped`;
    if (result.limited > 0) message += `, ${result.limited} over plan limit`;

    return back({ success: message });
});
