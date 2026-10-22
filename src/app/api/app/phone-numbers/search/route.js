import { NextResponse } from 'next/server';
import { gateClient, handler } from '@/lib/guards';
import { readBody, validate } from '@/lib/http';
import { defaultDriver } from '@/lib/services/telephony';

/** POST /app/phone-numbers/search */
export const POST = handler(async (request) => {
    const gate = await gateClient({ routeName: 'client.phone-numbers.search' });
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        country: ['required', 'string', 'size:2'],
        area_code: ['nullable', 'string', 'max:6'],
        type: ['required', 'string', 'in:local,toll_free,mobile'],
    });

    const result = await defaultDriver().searchAvailableNumbers(
        String(data.country).toUpperCase(),
        data.area_code ?? null,
        data.type,
    );

    return NextResponse.json(result);
});
