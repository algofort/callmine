import 'server-only';

import AppShell from '@/components/AppShell';
import { sharedProps } from '@/lib/shared-props';
import { plain } from '@/lib/serialize';

/**
 * Renders a React page component with server-resolved props.
 *
 * Usage inside a server `page.jsx`:
 *
 *   import AgentsIndex from '@/views/client/Agents/Index';
 *   export default async function Page({ searchParams }) {
 *       const props = await buildProps(await searchParams);
 *       return renderPage(AgentsIndex, 'client/Agents/Index', props);
 *   }
 */
export async function renderPage(Component, componentName, props = {}, options = {}) {
    const shared = await sharedProps({ isAdminRoute: options.isAdminRoute ?? componentName.startsWith('Admin/') });
    const safe = plain(props);

    return (
        <AppShell shared={plain(shared)} props={safe} component={componentName} url={options.url ?? '/'}>
            <Component {...safe} />
        </AppShell>
    );
}

export default renderPage;
