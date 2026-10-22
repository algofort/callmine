import VoicesIndex from '@/views/client/Voices/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { paginate } from '@/lib/paginate';

export const dynamic = 'force-dynamic';

/** GET /app/voices */
export default async function Page({ searchParams }) {
    await requireClientPage();
    const params = await searchParams;

    const where = { is_active: true };
    if (params?.search) {
        const s = String(params.search);
        where.OR = [{ name: { contains: s } }, { accent: { contains: s } }];
    }
    for (const filter of ['gender', 'age_group', 'best_for']) {
        if (params?.[filter]) where[filter] = String(params[filter]);
    }

    const voices = await paginate(prisma.voice, {
        where,
        orderBy: { name: 'asc' },
        perPage: 24,
        page: params?.page ?? 1,
        path: '/app/voices',
        query: {
            search: params?.search,
            gender: params?.gender,
            age_group: params?.age_group,
            best_for: params?.best_for,
        },
        transform: (v) => ({
            id: Number(v.id),
            name: v.name,
            gender: v.gender,
            age_group: v.age_group,
            tone: v.tone,
            best_for: v.best_for,
            accent: v.accent,
            language: v.language,
            preview_url: v.preview_url,
        }),
    });

    const active = { is_active: true };
    const [voicesTotal, languages, accents, genderOpts, ageOpts, bestForOpts] = await Promise.all([
        prisma.voice.count({ where: active }),
        prisma.voice.findMany({ where: { ...active, language: { not: null } }, distinct: ['language'], select: { language: true } }),
        prisma.voice.findMany({ where: { ...active, accent: { not: null } }, distinct: ['accent'], select: { accent: true } }),
        prisma.voice.findMany({ where: { gender: { not: null } }, distinct: ['gender'], select: { gender: true } }),
        prisma.voice.findMany({ where: { age_group: { not: null } }, distinct: ['age_group'], select: { age_group: true } }),
        prisma.voice.findMany({ where: { best_for: { not: null } }, distinct: ['best_for'], select: { best_for: true } }),
    ]);

    const props = {
        voices,
        stats: [
            { label: 'Total voices', value: voicesTotal, icon: 'audio', accent: 'brand' },
            { label: 'Languages', value: languages.length, icon: 'globe', accent: 'signal' },
            { label: 'Accents', value: accents.length, icon: 'message', accent: 'cold' },
        ],
        filters: {
            ...(params?.search ? { search: String(params.search) } : {}),
            ...(params?.gender ? { gender: String(params.gender) } : {}),
            ...(params?.age_group ? { age_group: String(params.age_group) } : {}),
            ...(params?.best_for ? { best_for: String(params.best_for) } : {}),
        },
        filterOptions: {
            gender: genderOpts.map((r) => r.gender),
            age_group: ageOpts.map((r) => r.age_group),
            best_for: bestForOpts.map((r) => r.best_for),
        },
    };

    return renderPage(VoicesIndex, 'client/Voices/Index', props, { url: '/app/voices' });
}
