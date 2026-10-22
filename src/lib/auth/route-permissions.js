import 'server-only';

import { CLIENT_MODULES } from '@/lib/rbac-catalog.mjs';

/**
 * Derives the team permission a customer-side write endpoint requires from its
 * route name.
 *
 * Every write route already declares a structured name — `client.agents.store`,
 * `client.team.roles.update`, `client.phone-numbers.release` — so the required
 * `module.action` key is derivable instead of being repeated (and forgotten) in
 * 70-odd files. A route added later is covered the moment it follows the naming
 * convention.
 *
 * Reads are deliberately not derived here: pages already gate what a member can
 * open, and silently denying a GET would be far harder to diagnose than denying
 * the write it belongs to.
 */

/** Route-name prefix (after `client.`) -> permission module. */
const MODULE_FOR = {
    agents: 'agents',
    campaigns: 'campaigns',
    contacts: 'contacts',
    crm: 'contacts',
    calls: 'calls',
    voices: 'voices',
    'knowledge-base': 'knowledge',
    'phone-numbers': 'numbers',
    sip: 'numbers',
    integrations: 'integrations',
    'google-sheets': 'integrations',
    messaging: 'messaging',
    conversations: 'messaging',
    billing: 'billing',
    checkout: 'billing',
    subscription: 'billing',
    team: 'team',
    settings: 'settings',
    'api-keys': 'api',
    flows: 'automation',
    forms: 'automation',
    appointments: 'automation',
    'prompt-templates': 'automation',
    'website-widget': 'automation',
    'incoming-connections': 'automation',
    marketing: 'marketing',
    'support-system': 'support',
};

/**
 * Routes every authenticated member may use regardless of role: their own
 * profile and password, switching between workspaces they already belong to,
 * and account-level identity verification.
 */
const ALWAYS_ALLOWED = new Set([
    'client.profile.update',
    'client.profile.destroy',
    'client.tenants.switch',
    'client.tenants.store',
    'client.kyc.upload',
    'client.verification.upload',
]);

/** Final route segment -> intent. Anything unlisted counts as an update. */
const CREATE_VERBS = new Set(['store', 'create', 'import', 'buy', 'duplicate', 'bulk-generate', 'use', 'send', 'reply']);
const DELETE_VERBS = new Set(['destroy', 'delete', 'release', 'revoke', 'disconnect']);

/**
 * The permission key `routeName` requires, or null when the route is exempt or
 * does not follow the convention.
 */
export function permissionForRoute(routeName) {
    const name = String(routeName ?? '');
    if (!name.startsWith('client.') || ALWAYS_ALLOWED.has(name)) return null;

    const parts = name.slice('client.'.length).split('.').filter(Boolean);
    if (parts.length < 2) return null;

    const module = MODULE_FOR[parts[0]];
    if (!module) return null;

    const available = CLIENT_MODULES[module] ?? ['read'];
    const verb = parts[parts.length - 1];

    let action = 'update';
    if (CREATE_VERBS.has(verb)) action = 'create';
    else if (DELETE_VERBS.has(verb)) action = 'delete';

    // A module that has no fine-grained actions gates every write behind
    // `manage`, and one that is read-only gates it behind `read`.
    if (!available.includes(action)) {
        action = available.includes('manage') ? 'manage' : available.includes('update') ? 'update' : 'read';
    }

    return `${module}.${action}`;
}
