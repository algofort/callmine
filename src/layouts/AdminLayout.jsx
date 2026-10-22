'use client';

import { route } from '@/lib/route';
import { Link, usePage } from '@/lib/page-router';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/Sidebar';
import SidebarBrandLink from '@/components/SidebarBrandLink';
import Topbar from '@/components/Topbar';
import FlashToast from '@/components/FlashToast';
import {
    LayoutDashboard,
    Users,
    Package,
    CreditCard,
    Cpu,
    MonitorPlay,
    Globe,
    Banknote,
    Settings,
    FileText,
    ShieldCheck,
    UserCog,
    SlidersHorizontal,
    Smartphone,
    Receipt,
    Layers,
    Cable,
    UserCheck,
    LogIn,
    Coins,
    AudioLines,
    ListChecks,
    MessageSquare,
    Mail,
    Landmark,
    Bell,
    Phone,
    FileCheck,
    Contact,
    Server,
} from 'lucide-react';

const ic = 'h-4 w-4';
const gic = 'h-4 w-4 shrink-0';

/** Grouped admin nav. Each group: { label, icon?, alwaysActive?, items:[{labelKey, route, icon, permission, permissionAlt}] } */
const ADMIN_GROUPS = [
    { label: 'Overview', alwaysActive: true, items: [
        { labelKey: 'admin.dashboard', route: 'admin.dashboard', icon: LayoutDashboard },
    ] },
    { label: 'Customers', icon: Users, alwaysActive: true, items: [
        { labelKey: 'admin.client_management', route: 'admin.clients.index', icon: Users, permission: 'view_clients' },
        { labelKey: 'admin.contacts_nav', route: 'admin.contacts.index', icon: Contact, permission: 'view_clients' },
        { labelKey: 'admin.kyc_nav', route: 'admin.kyc.index', icon: FileCheck, permission: 'view_clients' },
    ] },
    { label: 'Calling', icon: AudioLines, alwaysActive: true, items: [
        { labelKey: 'admin.engines_nav', route: 'admin.engines.index', icon: Cpu, permission: 'view_settings' },
        { labelKey: 'admin.call_monitoring', route: 'admin.call-monitoring.index', icon: MonitorPlay, permission: 'view_settings' },
        { labelKey: 'admin.batch_jobs', route: 'admin.batch-jobs.index', icon: Layers, permission: 'view_settings' },
        { labelKey: 'admin.call_queue', route: 'admin.call-queue.index', icon: ListChecks, permission: 'view_settings' },
        { labelKey: 'admin.phone_pool', route: 'admin.phone-pool.index', icon: Phone, permission: 'view_settings' },
    ] },
    { label: 'Billing', icon: CreditCard, alwaysActive: true, items: [
        { labelKey: 'admin.subscriptions_nav', route: 'admin.subscriptions.index', icon: CreditCard, permission: 'view_subscriptions' },
        { labelKey: 'admin.plans_nav', route: 'admin.plans.index', icon: Package, permission: 'view_plans' },
        { labelKey: 'admin.credit_packages', route: 'admin.credit-packages.index', icon: Coins, permission: 'view_plans' },
        { labelKey: 'admin.payment_gateways', route: 'admin.payment-gateways.index', icon: Landmark, permission: 'view_payment_gateways' },
        { labelKey: 'admin.payments_nav', route: 'admin.payments.index', icon: Receipt, permission: 'view_payment_gateways' },
    ] },
    { label: 'Communication', icon: MessageSquare, items: [
        { labelKey: 'admin.messaging', route: 'admin.messaging.index', icon: MessageSquare, permission: 'view_settings' },
        { labelKey: 'admin.email', route: 'admin.email-system.index', icon: Mail, permission: 'view_email_settings' },
    ] },
    { label: 'Localization', icon: Globe, items: [
        { labelKey: 'admin.currencies', route: 'admin.currencies.index', icon: Banknote, permission: 'view_currencies' },
        { labelKey: 'admin.languages', route: 'admin.locales.index', icon: Globe, permission: 'view_languages' },
    ] },
    { label: 'Access control', icon: ShieldCheck, items: [
        { labelKey: 'admin.roles_permissions', route: 'admin.roles-permissions.index', icon: ShieldCheck, permission: 'view_admin_roles', permissionAlt: 'manage_admin_roles' },
        { labelKey: 'admin.admins', route: 'admin.admins.index', icon: UserCog, permission: 'view_admins' },
    ] },
    { label: 'System', icon: Settings, items: [
        { labelKey: 'admin.system_health', route: 'admin.system.index', icon: Server, permission: 'view_settings' },
        { labelKey: 'admin.general_settings', route: 'admin.general-settings.index', icon: SlidersHorizontal, permission: 'view_settings' },
        { labelKey: 'admin.settings', route: 'admin.settings.index', icon: Settings, permission: 'view_settings' },
        { labelKey: 'admin.social_login', route: 'admin.social-login.index', icon: LogIn, permission: 'view_settings' },
        { labelKey: 'admin.notifications', route: 'admin.notifications.index', icon: Bell, permission: 'view_settings' },
        { labelKey: 'admin.audit_log', route: 'admin.audit-log.index', icon: FileText, permission: 'view_settings' },
    ] },
];

/** Build permission-filtered nav groups for the Sidebar (navGroups API). */
function useAdminNav() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];

    return useMemo(() => {
        const has = (key) => permissions.includes(key);
        return ADMIN_GROUPS
            .map((g) => ({
                type: 'group',
                label: g.label,
                variant: g.alwaysActive ? undefined : 'accent',
                alwaysActive: g.alwaysActive === true,
                icon: g.icon ? <g.icon className={gic} /> : null,
                items: g.items
                    .filter((i) => !i.permission || has(i.permission) || (i.permissionAlt && has(i.permissionAlt)))
                    .map((i) => ({
                        label: t(i.labelKey),
                        route: i.route,
                        href: route(i.route),
                        icon: <i.icon className={ic} />,
                        active: () => route().current(i.route),
                    })),
            }))
            .filter((g) => g.items.length > 0);
    }, [t, permissions]);
}

function AdminLayoutFooter() {
    const { t } = useTranslation();
    const adminUser = usePage().props.auth?.adminUser;
    return (
        <div className="space-y-1">
            <Link
                href={route('login')}
                className="block rounded-soft px-3 py-2 text-sm text-ink-300 hover:bg-white/[0.06] hover:text-white transition duration-150"
            >
                ← {t('admin.client_login')}
            </Link>
            <Link
                href={route('admin.logout')}
                method="post"
                as="button"
                className="block w-full text-left rtl:text-right rounded-soft px-3 py-2 text-sm text-ink-300 hover:bg-white/[0.06] hover:text-white transition duration-150"
            >
                {t('nav.logout')}
            </Link>
            {adminUser && (
                <p className="px-3 py-1 text-xs text-ink-500 truncate" title={adminUser.email}>
                    {adminUser.email}
                </p>
            )}
        </div>
    );
}

export default function AdminLayout({ title = 'Admin', header, children }) {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const adminNav = useAdminNav();

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <FlashToast />
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                title={t('nav.admin')}
                logo={<SidebarBrandLink href={route('admin.dashboard')} ariaLabel={t('nav.admin')} />}
                showCreateButton={false}
                navGroups={adminNav}
                footer={<AdminLayoutFooter />}
            />

            <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
                <Topbar
                    showLogo={false}
                    title={title}
                    showWorkspace={false}
                    showLocale={false}
                    showCurrency={false}
                    userNavItems={[
                        { label: t('admin.client_login'), href: route('login'), as: 'link' },
                        { type: 'divider' },
                        { label: t('nav.logout'), href: route('admin.logout'), method: 'post', as: 'link' },
                    ]}
                />

                <main className="p-4 sm:p-6 lg:p-8">
                    {header && typeof header === 'object' && (
                        <div className="mb-6">
                            {header}
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-soft-lg bg-white dark:bg-neutral-900 border border-soft border-gray-200 dark:border-neutral-800 shadow-soft-lg text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden rtl:right-auto rtl:left-4"
                aria-label={t('open_menu')}
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
    );
}
