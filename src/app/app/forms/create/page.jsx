import FormBuilder from '@/views/client/Forms/Builder';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { FIELD_TYPES, FORM_STATUS } from '@/lib/domain/forms';

export const dynamic = 'force-dynamic';

/** GET /app/forms/create */
export default async function Page() {
    await requireClientPage();

    const props = {
        form: {
            id: null,
            name: '',
            description: '',
            status: FORM_STATUS.ACTIVE,
            fields: [],
            public_token: null,
        },
        isNew: true,
        fieldTypes: FIELD_TYPES,
    };

    return renderPage(FormBuilder, 'client/Forms/Builder', props, { url: '/app/forms/create' });
}
