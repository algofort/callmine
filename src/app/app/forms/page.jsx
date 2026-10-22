import FormsIndex from '@/views/client/Forms/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';
import { iso } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/** GET /app/forms */
export default async function Page({ searchParams }) {
    const { clientId } = await requireClientPage();
    const params = await searchParams;
    const client_id = BigInt(clientId);

    // Form uses SoftDeletes.
    const where = { client_id, deleted_at: null };
    if (params?.search) where.name = { contains: String(params.search) };
    if (params?.status) where.status = String(params.status);

    const forms = await paginate(prisma.form, {
        where,
        orderBy: { id: 'desc' },
        include: { _count: { select: { form_submissions: true } } },
        perPage: 12,
        page: params?.page ?? 1,
        path: '/app/forms',
        query: { search: params?.search, status: params?.status },
        transform: (f) => ({
            id: Number(f.id),
            name: f.name,
            status: f.status,
            fields_count: Array.isArray(f.fields) ? f.fields.length : 0,
            submissions_count: f._count.form_submissions,
            updated_at: iso(f.updated_at),
        }),
    });

    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const base = { client_id, deleted_at: null };
    const [total, active, submissions, thisWeek] = await Promise.all([
        prisma.form.count({ where: base }),
        prisma.form.count({ where: { ...base, status: 'active' } }),
        prisma.formSubmission.count({ where: { client_id } }),
        prisma.formSubmission.count({ where: { client_id, created_at: { gte: weekAgo } } }),
    ]);

    const props = {
        forms,
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.status ? { status: String(params.status) } : {}),
        },
        stats: [
            { label: 'Total forms', value: String(total), icon: 'file', accent: 'brand' },
            { label: 'Active', value: String(active), icon: 'check', accent: 'signal' },
            { label: 'Submissions', value: String(submissions), icon: 'list', accent: 'cold' },
            { label: 'This week', value: String(thisWeek), icon: 'clock', accent: 'warm' },
        ],
    };

    return renderPage(FormsIndex, 'client/Forms/Index', props, { url: '/app/forms' });
}
