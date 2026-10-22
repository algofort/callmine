import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { plain } from '@/lib/serialize';
import { takeFlash } from '@/lib/flash';
import { assetUrl, brandingPayload, DEFAULT_BRANDING, socialLoginPayload } from '@/lib/settings';
import { localesForSwitcher, translationsFor } from '@/lib/i18n-server';
import {
    accessibleTenants,
    clientPermissionKeys,
    creditBalance,
    currentAdmin,
    currentUser,
    adminPermissionKeys,
    tenantAccessibleBy,
} from '@/lib/auth';
import { getSession } from '@/lib/auth/session';

/**
 * Port of .
 *
 * Every page passes the result to <PageProvider shared={...}> so `usePage().props`
 * carries exactly the keys the ported components already read.
 */
export async function sharedProps({ isAdminRoute = false } = {}) {
    try {
        return await buildShared({ isAdminRoute });
    } catch (e) {
        console.error('[shared-props] failed:', e);
        return fallbackShared();
    }
}

async function buildShared({ isAdminRoute }) {
    const [session, user, adminUser] = await Promise.all([
        getSession(),
        currentUser(),
        isAdminRoute ? currentAdmin() : Promise.resolve(null),
    ]);

    const locale = user?.locale || session?.locale || config.app.locale;
    const i18nLocales = await localesForSwitcher();
    const rtlCodes = i18nLocales.filter((l) => l.is_rtl).map((l) => l.code);
    const rtl = rtlCodes.length ? rtlCodes : config.locales.rtl;
    const isRtl = rtl.includes(locale);

    const customer = user?.clients ?? null;

    const [
        branding,
        socialLogin,
        translations,
        currencies,
        defaultCurrency,
        clientPerms,
        adminPerms,
        credits,
        notificationsUnread,
        tenantBits,
        flash,
    ] = await Promise.all([
        brandingPayload(),
        socialLoginPayload(),
        translationsFor(locale),
        enabledCurrencies(),
        defaultCurrencyCode(),
        user ? clientPermissionKeys(user) : Promise.resolve([]),
        isAdminRoute && adminUser ? adminPermissionKeys(adminUser.id) : Promise.resolve([]),
        user?.client_id ? creditBalance(user.client_id) : Promise.resolve(null),
        unreadNotifications(user),
        resolveTenants(user, session),
        takeFlash(),
    ]);

    const displayCurrency =
        user?.display_currency ??
        tenantBits.currentTenantCurrency ??
        session?.display_currency ??
        defaultCurrency ??
        'USD';

    const supportedLocales = Object.fromEntries(i18nLocales.map((l) => [l.code, l.native_name]));

    const auth = {
        user: user
            ? plain({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  status: user.status,
                  client_id: user.client_id,
                  client_role: user.client_role,
                  tenant_id: user.tenant_id,
                  locale: user.locale,
                  display_currency: user.display_currency,
                  theme: user.theme,
                  email_verified_at: user.email_verified_at,
                  notifications_read_at: user.notifications_read_at,
                  created_at: user.created_at,
              })
            : null,
        customer: customer
            ? {
                  id: Number(customer.id),
                  name: customer.name,
                  email: customer.email,
                  status: customer.status,
                  kyc_status: customer.kyc_status,
                  kyc_verified: customer.kyc_status === 'verified',
                  avatar_url: customer.avatar_path ? assetUrl(customer.avatar_path) : null,
              }
            : null,
        adminUser:
            isAdminRoute && adminUser
                ? {
                      id: Number(adminUser.id),
                      name: adminUser.name,
                      email: adminUser.email,
                      status: adminUser.status,
                  }
                : null,
        permissions: adminPerms,
        clientPermissions: clientPerms,
    };

    return {
        flash: { success: flash.success ?? null, error: flash.error ?? null, openEditPlanId: flash.openEditPlanId ?? null },
        errors: {},
        auth,
        impersonation: await resolveImpersonation(session),
        theme: user?.theme ?? session?.theme ?? 'light',
        currentTenant: tenantBits.currentTenant,
        tenants: tenantBits.tenants,
        locale,
        dir: isRtl ? 'rtl' : 'ltr',
        i18n: { locale, isRtl, locales: i18nLocales, translations },
        supportedLocales: Object.keys(supportedLocales).length ? supportedLocales : { en: 'English' },
        rtlLocales: rtl,
        currencies,
        displayCurrency,
        demo_mode: config.app.demo_mode,
        demo_credentials: config.app.demo_mode
            ? {
                  client: { email: config.seed.client_email, password: config.seed.client_password },
                  admin: { email: config.seed.admin_email, password: config.seed.admin_password },
              }
            : null,
        credits,
        notificationsUnread,
        marketing: {
            appStoreUrl: config.frontend.app_store_url,
            googlePlayUrl: config.frontend.google_play_url,
        },
        branding,
        socialLogin,
    };
}

/* -------------------------------------------------------------- fragments */

async function enabledCurrencies() {
    try {
        const rows = await prisma.currency.findMany({
            where: { enabled: true },
            orderBy: [{ is_default: 'desc' }, { code: 'asc' }],
            select: { code: true, symbol: true, decimals: true, exchange_rate: true },
        });
        return rows.map((c) => ({
            code: c.code,
            symbol: c.symbol,
            decimals: c.decimals,
            exchange_rate: Number(c.exchange_rate),
        }));
    } catch {
        return [];
    }
}

async function defaultCurrencyCode() {
    try {
        const row = await prisma.currency.findFirst({ where: { is_default: true, enabled: true } });
        return row?.code ?? null;
    } catch {
        return null;
    }
}

async function unreadNotifications(user) {
    if (!user?.client_id) return 0;
    try {
        return await prisma.notification.count({
            where: {
                OR: [{ client_id: user.client_id }, { client_id: null }],
                ...(user.notifications_read_at ? { created_at: { gt: user.notifications_read_at } } : {}),
            },
        });
    } catch {
        return 0;
    }
}

async function resolveTenants(user, session) {
    if (!user) return { currentTenant: null, tenants: [], currentTenantCurrency: null };

    let currentTenant = null;
    let currentTenantCurrency = null;

    const tenantId = session?.current_tenant_id ?? user.tenant_id;
    if (tenantId) {
        try {
            const tenant = await prisma.tenant.findUnique({ where: { id: BigInt(tenantId) } });
            if (tenant && (await tenantAccessibleBy(tenant, user))) {
                currentTenant = { id: Number(tenant.id), name: tenant.name };
                currentTenantCurrency = tenant.currency_code ?? null;
            }
        } catch {
            currentTenant = null;
        }
    }

    let tenants = [];
    try {
        tenants = (await accessibleTenants(user)).map((t) => ({ id: Number(t.id), name: t.name }));
    } catch {
        tenants = [];
    }

    return { currentTenant, tenants, currentTenantCurrency };
}

async function resolveImpersonation(session) {
    if (!session?.impersonating || !session?.impersonated_client_id) return null;
    let client = null;
    try {
        client = await prisma.client.findUnique({
            where: { id: BigInt(session.impersonated_client_id) },
            select: { name: true },
        });
    } catch {
        client = null;
    }
    return {
        active: true,
        clientName: client?.name ?? 'Unknown',
        returnUrl: '/admin/impersonation/stop',
    };
}

/** Mirrors the try/catch fallback payload in . */
function fallbackShared() {
    const locale = config.app.locale;
    return {
        flash: { success: null, error: null },
        errors: {},
        auth: { user: null, customer: null, adminUser: null, permissions: [], clientPermissions: [] },
        impersonation: null,
        currentTenant: null,
        tenants: [],
        locale,
        dir: 'ltr',
        i18n: { locale, isRtl: config.locales.rtl.includes(locale), locales: [], translations: {} },
        supportedLocales: { en: 'English' },
        rtlLocales: ['ar'],
        currencies: [],
        displayCurrency: 'USD',
        theme: 'light',
        demo_mode: false,
        demo_credentials: null,
        credits: null,
        notificationsUnread: 0,
        marketing: { appStoreUrl: null, googlePlayUrl: null },
        branding: DEFAULT_BRANDING,
        socialLogin: { enabled: false, google: false, firebase: {} },
    };
}
