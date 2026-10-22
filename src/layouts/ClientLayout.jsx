'use client';

import { route } from '@/lib/route';
import { usePage, router } from '@/lib/page-router';
import SidebarBrandLink from '@/components/SidebarBrandLink';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Topbar from '@/components/Topbar'; // Will be updated during folder move
import Sidebar from '@/components/Sidebar';
import FlashToast from '@/components/FlashToast';
import { Link } from '@/lib/page-router';
import { PhoneCall, LogOut } from 'lucide-react';

function CreditChip({ credits }) {
    if (credits === null || credits === undefined) return null;
    return (
        <Link
            href={route('client.billing.index')}
            className="flex items-center gap-1.5 rounded-soft border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition"
            title="Calling credits"
        >
            <PhoneCall className="h-4 w-4" />
            <span className="font-mono tabular-nums">{Number(credits).toLocaleString()}</span>
        </Link>
    );
}
import {
    LayoutDashboard,
    CreditCard,
    Package,
    FileText,
    Users,
    Settings,
    User,
    ShoppingCart,
    ClipboardList,
    Zap,
    UserPlus,
    ShieldCheck,
    Smartphone,
    Server,
    Cpu,
    RefreshCw,
    Map,
    MapPin,
    Megaphone,
    Ticket,
    Gift,
    Headphones,
    LifeBuoy,
    Wallet,
    Tag,
    Landmark,
    BarChart3,
    TrendingUp,
    Bot,
    AudioLines,
    BookOpen,
    Contact,
    Phone,
    Cable,
    Mail,
    MessageCircle,
    Inbox,
    Code2,
    Network,
    FileCheck,
    Bell,
    Workflow,
    ListChecks,
    LayoutTemplate,
    Wrench,
    ClipboardList as ClipboardListIcon,
    CalendarClock,
    Globe as GlobeIcon,
    KanbanSquare,
    PhoneIncoming,
    Table as TableIcon,
} from 'lucide-react';

const iconClass = 'h-4 w-4';

function useClientNav() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const user = auth?.user;
    const isClientAdmin = user?.client_role === 'administrator';
    const perms = auth?.clientPermissions ?? ['*'];
    const can = (k) => perms.includes('*') || perms.includes(k);
    const tr = (key, fallback) => (t(key) !== key ? t(key) : fallback);
    const gi = 'h-4 w-4 shrink-0';

    const groups = [
        {
            label: tr('nav.overview', 'Overview'), alwaysActive: true,
            items: [
                { label: t('nav.dashboard'), href: route('client.dashboard'), icon: <LayoutDashboard className={iconClass} />, route: 'client.dashboard' },
            ],
        },
        {
            label: tr('nav.calling', 'Calling'), alwaysActive: true, icon: <PhoneCall className={gi} />,
            items: [
                { label: tr('nav.campaigns', 'Campaigns'), href: route('client.campaigns.index'), icon: <Megaphone className={iconClass} />, route: 'client.campaigns.*' },
                { label: tr('nav.agents', 'Agents'), href: route('client.agents.index'), icon: <Bot className={iconClass} />, route: 'client.agents.*' },
                { label: tr('nav.voices', 'Voices'), href: route('client.voices.index'), icon: <AudioLines className={iconClass} />, route: 'client.voices.*' },
                { label: tr('nav.contacts', 'Contacts'), href: route('client.contacts.index'), icon: <Contact className={iconClass} />, route: 'client.contacts.*' },
                { label: tr('nav.phone_numbers', 'Phone Numbers'), href: route('client.phone-numbers.index'), icon: <Phone className={iconClass} />, route: 'client.phone-numbers.*' },
                { label: tr('nav.calls', 'Calls'), href: route('client.calls.index'), icon: <PhoneCall className={iconClass} />, route: 'client.calls.*' },
                { label: tr('nav.analytics', 'Analytics'), href: route('client.analytics.index'), icon: <BarChart3 className={iconClass} />, route: 'client.analytics.*' },
                { label: tr('nav.knowledge_base', 'Knowledge Base'), href: route('client.knowledge-base.index'), icon: <BookOpen className={iconClass} />, route: 'client.knowledge-base.*' },
            ],
        },
        {
            label: tr('nav.automation', 'Automation'), alwaysActive: true, icon: <Workflow className={gi} />,
            items: [
                { label: tr('nav.flows', 'Flows'), href: route('client.flows.index'), icon: <Workflow className={iconClass} />, route: 'client.flows.index' },
                { label: tr('nav.flow_templates', 'Templates'), href: route('client.flows.templates'), icon: <LayoutTemplate className={iconClass} />, route: 'client.flows.templates' },
                { label: tr('nav.flow_executions', 'Execution Logs'), href: route('client.flows.executions.index'), icon: <ListChecks className={iconClass} />, route: 'client.flows.executions.*' },
            ],
        },
        {
            label: tr('nav.messaging', 'Messaging'), alwaysActive: true, icon: <MessageCircle className={gi} />,
            items: [
                { label: 'Email Templates', href: route('client.messaging.email-templates.index'), icon: <Mail className={iconClass} />, route: 'client.messaging.email-templates.*' },
                { label: 'WhatsApp', href: route('client.messaging.whatsapp.index'), icon: <MessageCircle className={iconClass} />, route: 'client.messaging.whatsapp.*' },
                { label: 'Conversations', href: route('client.conversations.index'), icon: <Inbox className={iconClass} />, route: 'client.conversations.*' },
            ],
        },
        {
            label: tr('nav.integrations_section', 'Integrations'), alwaysActive: true, icon: <Cable className={gi} />,
            items: [
                { label: 'Webhooks', href: route('client.integrations.index'), icon: <Cable className={iconClass} />, route: 'client.integrations.*' },
                { label: tr('nav.api_keys', 'API Keys'), href: route('client.api-keys.index'), icon: <Code2 className={iconClass} />, route: 'client.api-keys.*', permission: 'api.read' },
                { label: tr('nav.sip', 'SIP Trunks'), href: route('client.sip.index'), icon: <Network className={iconClass} />, route: 'client.sip.*' },
            ],
        },
        {
            label: tr('nav.tools', 'Tools'), alwaysActive: true, icon: <Wrench className={gi} />,
            items: [
                { label: tr('nav.forms', 'Forms'), href: route('client.forms.index'), icon: <ClipboardListIcon className={iconClass} />, route: 'client.forms.*' },
                { label: tr('nav.appointments', 'Appointments'), href: route('client.appointments.index'), icon: <CalendarClock className={iconClass} />, route: 'client.appointments.*' },
                { label: tr('nav.website_widget', 'Website Widget'), href: route('client.website-widget.index'), icon: <GlobeIcon className={iconClass} />, route: 'client.website-widget.*' },
                { label: tr('nav.quick_crm', 'Quick CRM'), href: route('client.crm.board'), icon: <KanbanSquare className={iconClass} />, route: 'client.crm.*' },
                { label: tr('nav.incoming_connections', 'Incoming Connections'), href: route('client.incoming-connections.index'), icon: <PhoneIncoming className={iconClass} />, route: 'client.incoming-connections.*' },
                { label: tr('nav.google_sheets', 'Google Sheets'), href: route('client.google-sheets.index'), icon: <TableIcon className={iconClass} />, route: 'client.google-sheets.*' },
            ],
        },
        {
            label: tr('nav.billing_section', 'Billing'), variant: 'accent', icon: <CreditCard className={gi} />,
            items: [
                { label: tr('nav.billing', 'Billing & Credits'), href: route('client.billing.index'), icon: <Wallet className={iconClass} />, route: 'client.billing.index', permission: 'billing.read' },
                { label: t('nav.plans'), href: route('client.pricing'), icon: <Package className={iconClass} />, route: 'client.pricing' },
                { label: t('nav.subscription'), href: route('client.subscription.show'), icon: <CreditCard className={iconClass} />, route: 'client.subscription.show' },
            ],
        },
        {
            label: t('nav.marketing'), variant: 'accent', icon: <Megaphone className={gi} />, adminOnly: true,
            items: [
                { label: t('nav.vouchers'), href: route('client.marketing.vouchers'), icon: <Ticket className={iconClass} />, route: 'client.marketing.vouchers' },
                { label: t('nav.gift_cards'), href: route('client.marketing.gift-cards'), icon: <Gift className={iconClass} />, route: 'client.marketing.gift-cards' },
                { label: t('nav.referral_program'), href: route('client.marketing.referral'), icon: <UserPlus className={iconClass} />, route: 'client.marketing.referral' },
            ],
        },
        {
            label: tr('nav.reporting', 'Reports'), variant: 'accent', icon: <BarChart3 className={gi} />,
            items: [
                { label: t('nav.analytics_reports'), href: route('client.reporting.analytics'), icon: <BarChart3 className={iconClass} />, route: 'client.reporting.analytics' },
            ],
        },
        {
            label: tr('nav.support_system', 'Support'), variant: 'accent', icon: <Headphones className={gi} />,
            items: [
                { label: t('nav.support'), href: route('client.support-system.support'), icon: <LifeBuoy className={iconClass} />, route: 'client.support-system.support' },
            ],
        },
        {
            label: tr('nav.account', 'Account'), variant: 'accent', icon: <Settings className={gi} />,
            items: [
                ...(isClientAdmin ? [
                    { label: t('nav.team'), href: route('client.team.index'), icon: <Users className={iconClass} />, route: 'client.team.*' },
                    { label: t('nav.audit_log'), href: route('client.audit-log.index'), icon: <FileText className={iconClass} />, route: 'client.audit-log.index' },
                ] : []),
                { label: tr('nav.verification', 'Verification'), href: route('client.kyc.index'), icon: <FileCheck className={iconClass} />, route: 'client.kyc.*' },
                { label: tr('nav.notifications', 'Notifications'), href: route('client.alerts.notifications'), icon: <Bell className={iconClass} />, route: 'client.alerts.notifications' },
                { label: t('nav.settings'), href: route('client.settings.index'), icon: <Settings className={iconClass} />, route: 'client.settings.index' },
                { label: t('nav.profile'), href: route('client.profile.edit'), icon: <User className={iconClass} />, route: 'client.profile.edit' },
            ],
        },
    ];

    return groups
        .filter((g) => !g.adminOnly || isClientAdmin)
        .map((g) => ({ type: 'group', ...g, items: g.items.filter((i) => !i.permission || can(i.permission)) }))
        .filter((g) => g.items.length > 0);
}

export default function ClientLayout({ title = 'Dashboard', header, children }) {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth, impersonation, credits } = usePage().props;
    const user = auth?.user;
    const clientNavGroups = useClientNav();

    const returnToAdmin = () => {
        router.post(impersonation?.returnUrl ?? route('admin.impersonation.stop'));
    };


    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <FlashToast />
            {impersonation?.active && (
                <div className="flex items-center justify-between gap-4 bg-amber-500/90 text-white px-4 py-2 text-sm font-medium">
                    <span>{t('impersonation.impersonating', { name: impersonation.clientName })}</span>
                    <button
                        type="button"
                        onClick={returnToAdmin}
                        className="rounded-soft bg-white/20 px-3 py-1.5 font-medium hover:bg-white/30 transition"
                    >
                        {t('impersonation.return_to_admin')}
                    </button>
                </div>
            )}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                title={t('client.panel')}
                logo={<SidebarBrandLink href={route('client.dashboard')} ariaLabel={t('client.panel')} />}
                showCreateButton={false}
                navGroups={clientNavGroups.map(group => ({
                    ...group,
                    items: group.items.map(item => ({
                        ...item,
                        key: item.route || item.label,
                        active: () => item.route ? route().current(item.route) : false,
                    }))
                }))}
                footer={
                    <div className="space-y-1">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-2 rounded-soft px-3 py-2 text-left rtl:text-right text-sm text-ink-300 hover:bg-white/[0.06] hover:text-white transition duration-150"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {t('nav.logout')}
                        </Link>
                        {user && (
                            <div className="px-3 py-1">
                                {user.name && <p className="truncate text-sm font-medium text-white" title={user.name}>{user.name}</p>}
                                <p className="truncate text-xs text-ink-500" title={user.email}>{user.email}</p>
                            </div>
                        )}
                    </div>
                }
            />

            <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
                <Topbar
                    showLogo={false}
                    title={title}
                    extra={<CreditChip credits={credits} />}
                    userNavItems={[
                        { label: t('nav.profile'), href: route('client.profile.edit'), as: 'link' },
                        { type: 'divider' },
                        { label: t('nav.logout'), href: route('logout'), method: 'post', as: 'link' },
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

            {/* Mobile menu button */}
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
