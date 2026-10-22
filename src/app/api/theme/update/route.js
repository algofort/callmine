import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { back, readBody, validate } from '@/lib/http';
import { currentUser } from '@/lib/auth';
import { putSession } from '@/lib/auth/session';

/** POST /theme/update */
export const POST = handler(async (request) => {
    const data = await validate(await readBody(request), {
        theme: ['required', 'string', 'in:dark,light'],
    });

    const user = await currentUser();

    // A guest's theme lives only in localStorage (ThemeContext handles it).
    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { theme: data.theme, updated_at: new Date() },
        });
        await putSession({ theme: data.theme });
    }

    return back();
});
