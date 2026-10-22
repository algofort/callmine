import { notFound } from 'next/navigation';
import AdminEngineProvider from '@/views/Admin/Engines/Provider';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import prisma from '@/lib/prisma';
import { iso } from '@/lib/serialize';
import { integrationEnabled } from '@/lib/services/integrations';
import {
    PROVIDER_KIND,
    PROVIDER_LABEL,
    fieldState,
    providerConfigured,
} from '@/lib/domain/admin-engines';
import {
    poolCapacity,
    poolLoad,
    poolTotalAgents,
    poolUtilization,
} from '@/lib/services/elevenlabs';

export const dynamic = 'force-dynamic';

/** GET /admin/engines/providers/{provider} */
export default async function Page({ params }) {
    await requireAdminPermissions('view_settings');

    const { provider } = await params;
    if (!PROVIDER_KIND[provider]) notFound();

    const props = {
        provider: {
            key: provider,
            label: PROVIDER_LABEL[provider],
            kind: PROVIDER_KIND[provider],
            configured: await providerConfigured(provider),
            enabled: await integrationEnabled(provider, true),
            fields: await fieldState(provider),
        },
    };

    if (provider === 'elevenlabs') {
        const keys = await prisma.elevenLabsKey.findMany({ orderBy: { label: 'asc' } });

        props.keys = keys.map((k) => ({
            id: Number(k.id),
            label: k.label,
            max_concurrency: k.max_concurrency,
            current_load: k.current_load,
            status: k.status,
            agents_count: k.agents_count,
            last_health_check_at: iso(k.last_health_check_at),
            // Only the last four characters of the key are ever shown.
            key_hint: `••••${String(k.api_key ?? '').slice(-4)}`,
        }));

        props.poolStats = {
            capacity: await poolCapacity(),
            current_load: await poolLoad(),
            utilization: await poolUtilization(),
            total_agents: await poolTotalAgents(),
            total_voices: await prisma.voice.count(),
            key_count: keys.length,
        };
    }

    return renderPage(AdminEngineProvider, 'Admin/Engines/Provider', props, {
        url: `/admin/engines/providers/${provider}`,
        isAdminRoute: true,
    });
}
