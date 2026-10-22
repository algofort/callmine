import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { putSession } from '@/lib/auth/session';

/** PUT /locale */
export const PUT = handler(async (request) => {
    const rows = await prisma.locale.findMany({ where: { enabled: true }, select: { code: true } });
    const codes = rows.length ? rows.map((r) => r.code) : ['en'];

    const data = await validate(await readBody(request), {
        locale: ['required', 'string', `in:${codes.join(',')}`],
    });

    const user = await currentUser();

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { locale: data.locale, updated_at: new Date() },
        });
    }

    // Mirror it into the session so shared props pick it up on the next render
    // (and so a guest's choice survives too).
    await putSession({ locale: data.locale });

    return back();
});
