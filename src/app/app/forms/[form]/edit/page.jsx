import { notFound } from 'next/navigation';
import FormBuilder from '@/views/client/Forms/Builder';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { FIELD_TYPES } from '@/lib/domain/forms';

export const dynamic = 'force-dynamic';

/** GET /app/forms/{form}/edit */
export default async function Page({ params }) {
    const { clientId } = await requireClientPage();
    const { form: id } = await params;

    const form = await prisma.form.findUnique({ where: { id: BigInt(id) } });
    if (!form || String(form.client_id) !== String(clientId)) notFound();

    const props = {
        form: plain({
            id: form.id,
            name: form.name,
            description: form.description,
            status: form.status,
            fields: form.fields ?? [],
            public_token: form.public_token,
        }),
        isNew: false,
        fieldTypes: FIELD_TYPES,
    };

    return renderPage(FormBuilder, 'client/Forms/Builder', props, { url: `/app/forms/${id}/edit` });
}
