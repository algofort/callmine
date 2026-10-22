import WidgetIndex from '@/views/client/Widget/Index';
import { renderPage } from '@/lib/render';
import { requireClientPage } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { plain } from '@/lib/serialize';
import { firstOrCreateWidget } from '@/lib/domain/widget';

export const dynamic = 'force-dynamic';

/** GET /app/website-widget */
export default async function Page() {
    const { clientId } = await requireClientPage();
    const client_id = BigInt(clientId);

    const widget = await firstOrCreateWidget(clientId);

    const agent = widget.agent_id
        ? await prisma.agent.findUnique({
              where: { id: widget.agent_id },
              select: { id: true, name: true },
          })
        : null;

    const agents = await prisma.agent.findMany({
        where: { client_id, deleted_at: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    });

    const props = {
        config: plain({
            title: widget.title,
            welcome_message: widget.welcome_message,
            primary_color: widget.primary_color,
            position: widget.position,
            enabled: widget.enabled,
            agent_id: widget.agent_id,
            public_token: widget.public_token,
        }),
        agents: plain(agents),
        stats: [
            {
                label: 'Status',
                value: widget.enabled ? 'Enabled' : 'Disabled',
                icon: 'globe',
                accent: widget.enabled ? 'brand' : 'signal',
            },
            { label: 'Position', value: widget.position, icon: 'target', accent: 'cold' },
            { label: 'Agent', value: agent?.name ?? '—', icon: 'bot', accent: 'warm' },
        ],
    };

    return renderPage(WidgetIndex, 'client/Widget/Index', props, { url: '/app/website-widget' });
}
