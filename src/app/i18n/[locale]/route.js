import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { translationsFor } from '@/lib/i18n-server';

/**
 * GET /i18n/{locale}.
 * Serves the nested dictionary i18next-http-backend fetches; an unknown locale
 * falls back to the default, then to the first enabled one.
 */
export const GET = handler(async (request, { params }) => {
    const { locale } = await params;

    const rows = await prisma.locale.findMany({
        where: { enabled: true },
        orderBy: { is_default: 'desc' },
        select: { code: true, is_default: true },
    });

    const enabled = rows.length ? rows.map((r) => r.code) : ['en'];

    let code = locale;
    if (!enabled.includes(code)) code = rows.find((r) => r.is_default)?.code ?? enabled[0];

    return NextResponse.json({ translation: await translationsFor(code) });
});
