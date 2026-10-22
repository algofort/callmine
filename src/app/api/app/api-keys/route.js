import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gateClient, gatePlanFeature, handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { planFor } from '@/lib/plans';
import { SCOPES, generateApiKey } from '@/lib/domain/api-keys';

/** POST /app/api-keys */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.api-keys.store' });
    if (gate.response) return gate.response;

    const gated = await gatePlanFeature(gate.user, 'api');
    if (gated) return gated;

    const plan = await planFor(gate.clientId);
    const max = Number(plan?.api_keys_limit ?? 0);
    const activeCount = await prisma.apiKey.count({
        where: { client_id: BigInt(gate.clientId), revoked_at: null },
    });
    if (activeCount >= max) return back({ error: 'API key limit reached for your plan.' });

    const data = await validate(await readBody(request), {
        name: ['required', 'string', 'max:255'],
        scopes: ['required', 'array', 'min:1'],
        ip_whitelist: ['nullable', 'string'],
    });

    const scopes = (data.scopes ?? []).filter((s) => SCOPES.includes(s));
    if (!scopes.length) return back({ error: 'Select at least one valid scope.' });

    const ips = String(data.ip_whitelist ?? '')
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);

    const [key, plaintext] = await generateApiKey(gate.clientId, data.name, scopes, {
        ip_whitelist: ips.length ? ips : null,
        rate_limit_per_min: Number(plan?.api_rate_limit_per_min ?? 100),
        created_by: gate.user.id,
    });

    // The plaintext key is returned once — the UI shows it, then it is unrecoverable.
    return NextResponse.json({ newKey: { id: Number(key.id), plain: plaintext } });
});
