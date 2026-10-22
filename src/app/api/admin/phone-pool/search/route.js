import { NextResponse } from 'next/server';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { readBody, validate } from '@/lib/http';
import { defaultDriver } from '@/lib/services/telephony';

/** POST /admin/phone-pool/search */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.phone-pool.search', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        country: ['required', 'string', 'size:2'],
        area_code: ['nullable', 'string', 'max:6'],
        type: ['required', 'in:local,toll_free,mobile'],
    });

    return NextResponse.json(
        await defaultDriver().searchAvailableNumbers(
            String(data.country).toUpperCase(),
            data.area_code ?? null,
            data.type,
        ),
    );
});
