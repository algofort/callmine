import TenantsIndex from '@/views/client/Tenants/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import { accessibleTenants } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /app/tenants */
export default async function Page() {
    const { user } = await requireClientPage();

    const tenants = await accessibleTenants(user);
    const owned = tenants.filter((t) => String(t.owner_id) === String(user.id)).length;

    const props = {
        tenants: tenants.map((t) => ({
            id: Number(t.id),
            name: t.name,
            is_owner: String(t.owner_id) === String(user.id),
        })),
        stats: [
            { label: 'Total workspaces', value: tenants.length, icon: 'building', accent: 'brand' },
            { label: 'Owned', value: owned, icon: 'shield', accent: 'signal' },
            { label: 'Shared', value: tenants.length - owned, icon: 'share', accent: 'cold' },
        ],
    };

    return renderPage(TenantsIndex, 'client/Tenants/Index', props, { url: '/app/tenants' });
}
