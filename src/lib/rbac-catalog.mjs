/**
 * The customer-side permission catalog — the single definition of which team
 * permissions exist.
 *
 * Deliberately dependency-free (no `server-only`, no Prisma, no path aliases) so
 * that everything which needs it reads the same list: the RBAC service, the
 * route-permission resolver, and the standalone seed script. Keeping one copy is
 * what stops the seeded permissions from drifting out of step with the ones the
 * guards actually check.
 *
 * Adding a `module: [actions]` entry here is all it takes to introduce a new
 * permission — it is seeded, offered in the role editor, and picked up by the
 * system role templates automatically.
 */

/** module => [actions]. Each pair becomes a `module.action` permission key. */
export const CLIENT_MODULES = {
    dashboard: ['read'],
    campaigns: ['read', 'create', 'update', 'delete'],
    agents: ['read', 'create', 'update', 'delete'],
    voices: ['read'],
    contacts: ['read', 'create', 'update', 'delete'],
    calls: ['read'],
    numbers: ['read', 'create', 'delete'],
    knowledge: ['read', 'create', 'delete'],
    automation: ['read', 'create', 'update', 'delete'],
    marketing: ['read', 'create', 'update', 'delete'],
    support: ['read', 'create', 'update'],
    integrations: ['read', 'manage'],
    messaging: ['read', 'manage'],
    analytics: ['read'],
    billing: ['read', 'manage'],
    team: ['read', 'manage'],
    settings: ['read', 'manage'],
    api: ['read', 'manage'],
};

export const CLIENT_ROLE_KEYS = { OWNER: 'owner', ADMIN: 'admin', MANAGER: 'manager', VIEWER: 'viewer' };

export const CLIENT_ROLE_NAMES = { owner: 'Owner', admin: 'Admin', manager: 'Manager', viewer: 'Viewer' };

const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Every permission as `{ key, name, module, action }`. */
export function rbacCatalog() {
    const out = [];
    for (const [module, actions] of Object.entries(CLIENT_MODULES)) {
        for (const action of actions) {
            out.push({
                key: `${module}.${action}`,
                name: `${ucfirst(action)} ${ucfirst(module)}`,
                module,
                action,
            });
        }
    }
    return out;
}

/** The permission keys a system role grants. */
export function roleTemplate(roleKey) {
    const all = rbacCatalog().map((p) => p.key);

    if (roleKey === 'owner' || roleKey === 'admin') return all;
    if (roleKey === 'manager') {
        return all.filter(
            (k) =>
                !k.startsWith('billing.') &&
                k !== 'team.manage' &&
                k !== 'settings.manage' &&
                !k.startsWith('api.'),
        );
    }
    if (roleKey === 'viewer') return all.filter((k) => k.endsWith('.read'));
    return [];
}
