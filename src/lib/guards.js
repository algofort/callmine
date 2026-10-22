import 'server-only';

import { redirect } from 'next/navigation';
import config from '@/lib/config';
import prisma from '@/lib/prisma';
import { abort } from '@/lib/http';
import { canCreate, planFor, planHasFeature } from '@/lib/plans';
import {
    adminCan,
    adminIsSuper,
    clientPermissionKeys,
    currentAdmin,
    currentUser,
    effectiveSubscription,
    subscriptionIsActive,
    userCan,
} from '@/lib/auth';
import { getSession } from '@/lib/auth/session';
import { permissionForRoute } from '@/lib/auth/route-permissions';

/**
 * Route-handler guards — one function per access rule, composed by the routes.
 *
 * Page (server component) variants redirect; API variants return a Response you
 * return early from the handler:
 *
 *   const gate = await gateClient();
 *   if (gate.response) return gate.response;
 *   const { user, clientId } = gate;
 */

class HttpError extends Error {
    constructor(response) {
        super('guard');
        this.response = response;
    }
}
export { HttpError };

/* ---------------------------------------------------------- page contexts */

/** `['auth','role:client','client.scope','verified']` for a client-portal page. */
export async function requireClientPage() {
    const user = await currentUser();
    if (!user) redirect('/login');
    if (user.role !== 'client') redirect('/login');
    if (!user.email_verified_at) redirect('/verify-email');

    return { user, clientId: await resolveClientId(user) };
}

/** `['auth:admin']` for an admin-panel page. */
export async function requireAdminPage() {
    const admin = await currentAdmin();
    if (!admin) redirect('/admin/login');
    return admin;
}

/** `['auth']` only — profile, verification, tenant switch. */
export async function requireUserPage() {
    const user = await currentUser();
    if (!user) redirect('/login');
    return user;
}

/** Admin page gated on an RBAC permission. */
export async function requireAdminPermissionPage(permission) {
    const admin = await requireAdminPage();
    if (!(await adminCan(admin.id, permission))) redirect('/admin');
    return admin;
}

/* ----------------------------------------------------------- API contexts */

/** Client-portal write endpoint: auth + role + demo-mode + client scope. */
export async function gateClient({ permission = null, routeName = 'client.' } = {}) {
    const demo = demoBlocked(routeName);
    if (demo) return { response: demo };

    const user = await currentUser();
    if (!user) return { response: abort(401) };
    if (user.role !== 'client') return { response: abort(403) };

    // Fall back to the permission the route name implies, so a write endpoint is
    // covered by team RBAC without every handler having to name its own key.
    const required = permission ?? permissionForRoute(routeName);

    if (required && !(await userCan(user, required))) {
        return { response: abort(403, 'You do not have permission to perform this action.') };
    }

    return { user, clientId: await resolveClientId(user) };
}

/** Admin write endpoint: admin guard + demo-mode + optional permission. */
export async function gateAdmin({ permission = null, superOnly = false, routeName = 'admin.' } = {}) {
    const demo = demoBlocked(routeName);
    if (demo) return { response: demo };

    const admin = await currentAdmin();
    if (!admin) return { response: abort(401) };

    if (superOnly && !(await adminIsSuper(admin.id))) {
        return { response: abort(403, 'Super admin only.') };
    }
    if (permission && !(await adminCan(admin.id, permission))) {
        return { response: abort(403, 'You do not have permission to perform this action.') };
    }

    return { admin };
}

/** Any authenticated web user (profile, locale, theme). */
export async function gateUser({ routeName = '' } = {}) {
    const demo = demoBlocked(routeName);
    if (demo) return { response: demo };

    const user = await currentUser();
    if (!user) return { response: abort(401) };
    return { user };
}

/* -------------------------------------------------------------- modifiers */

/** `plan.limit:agents` */
export async function gatePlanLimit(clientId, key) {
    if (await canCreate(clientId, key)) return null;
    const resource = key.replace(/_/g, ' ');
    return abort(403, `You've reached your plan limit for ${resource}. Upgrade your plan to add more.`);
}

/** `plan.feature:messaging` */
export async function gatePlanFeature(user, ...features) {
    const subscription = await effectiveSubscription(user);
    if (!subscription || !subscriptionIsActive(subscription)) {
        return abort(403, 'This feature requires an active subscription.');
    }
    const plan = subscription.plans;
    for (const feature of features) {
        if (!planHasFeature(plan, feature)) {
            return abort(403, 'Your plan does not include this feature.');
        }
    }
    return null;
}

/** Page-side plan-feature check — bounces to the pricing page when locked. */
export async function requirePlanFeaturePage(user, ...features) {
    const subscription = await effectiveSubscription(user);
    if (!subscription || !subscriptionIsActive(subscription)) redirect('/app/pricing');

    const plan = subscription.plans;
    for (const feature of features) {
        if (!planHasFeature(plan, feature)) redirect('/app/pricing');
    }
    return plan;
}

/** `kyc.verified` */
export async function gateKyc(user) {
    const client = user?.client_id
        ? await prisma.client.findUnique({ where: { id: user.client_id } })
        : null;

    if (!client || client.kyc_status !== 'verified') {
        return abort(
            403,
            'Verify your business to unlock this. Upload your documents on the Verification page.',
        );
    }
    return null;
}

/** `demo` — blocks writes on admin./client./api.v1. routes when demo mode is on. */
export function demoBlocked(routeName = '') {
    if (!config.app.demo_mode) return null;

    const blocked =
        routeName.startsWith('admin.') ||
        routeName.startsWith('client.') ||
        routeName.startsWith('api.v1.') ||
        routeName === 'password.update';

    if (!blocked) return null;
    return abort(403, 'Demo mode: changes are disabled.');
}

/* --------------------------------------------------------------- helpers */

/** EnsureClientScope — falls back to the impersonated client id. */
export async function resolveClientId(user) {
    if (user?.client_id) return user.client_id;

    const session = await getSession();
    if (session?.impersonating && session?.impersonated_client_id) {
        return BigInt(session.impersonated_client_id);
    }
    return null;
}

/** Fail a request when a record belongs to a different client (abort_unless(...403)). */
export function assertOwned(record, clientId) {
    if (!record) throw new HttpError(abort(404));
    if (String(record.client_id) !== String(clientId)) throw new HttpError(abort(403));
    return record;
}

/** Wraps a handler so ValidationFailed / HttpError become proper responses. */
export function handler(fn) {
    return async (request, context) => {
        try {
            return await fn(request, context);
        } catch (e) {
            if (e?.response) return e.response;
            if (e?.name === 'ValidationFailed') {
                const { validationError } = await import('@/lib/http');
                return validationError(e.errors);
            }
            if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e;
            console.error('[route handler]', e);
            return abort(500, config.app.debug ? e.message : 'Server error.');
        }
    };
}

export { adminCan, adminIsSuper, clientPermissionKeys, planFor, userCan };
