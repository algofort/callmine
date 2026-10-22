import { notFound } from 'next/navigation';
import FormSubmissions from '@/views/client/Forms/Submissions';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso, plain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/forms/{form}/submissions */
export default async function Page({ params, searchParams }) {
    const { clientId } = await requireClientPage();
    const { form: id } = await params;
    const query = await searchParams;

    const form = await prisma.form.findUnique({ where: { id: BigInt(id) } });
    if (!form || String(form.client_id) !== String(clientId)) notFound();

    const submissions = await paginate(prisma.formSubmission, {
        where: { form_id: form.id },
        orderBy: { id: 'desc' },
        perPage: 20,
        page: query?.page ?? 1,
        path: `/app/forms/${id}/submissions`,
        transform: (s) => ({
            id: Number(s.id),
            data: plain(s.data ?? {}),
            created_at: iso(s.created_at),
        }),
    });

    const props = {
        form: plain({ id: form.id, name: form.name, fields: form.fields ?? [] }),
        submissions,
    };

    return renderPage(FormSubmissions, 'client/Forms/Submissions', props, {
        url: `/app/forms/${id}/submissions`,
    });
}
