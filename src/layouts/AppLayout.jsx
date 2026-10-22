'use client';

import { route } from '@/lib/route';
import { Link } from '@/lib/page-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
    Plus,
    FolderOpen,
    Folders,
    Database,
    CreditCard,
    Settings,
    LayoutGrid,
    BadgeDollarSign,
    ArrowLeftRight,
    Gift,
    Package,
    Hammer,
    Cpu,
    LayoutTemplate,
    Monitor,
    Puzzle,
    Globe,
    Clock,
    Settings2,
} from 'lucide-react';

const iconClass = "h-4 w-4";

const projectsNav = [
    { label: 'All Projects', href: '#', icon: <FolderOpen className={iconClass} /> },
    { label: 'File Manager', href: '#', icon: <Folders className={iconClass} /> },
    { label: 'Database', href: '#', icon: <Database className={iconClass} /> },
    { label: 'Billing', href: '#', icon: <CreditCard className={iconClass} /> },
    { label: 'Settings', href: '#', icon: <Settings className={iconClass} /> },
];

const administrationNav = [
    { label: 'Overview', href: route('admin.dashboard'), icon: <LayoutGrid className={iconClass} />, route: 'admin.dashboard' },
    { label: 'Subscriptions', href: '#', icon: <BadgeDollarSign className={iconClass} /> },
    { label: 'Transactions', href: '#', icon: <ArrowLeftRight className={iconClass} /> },
    { label: 'Referrals', href: '#', icon: <Gift className={iconClass} /> },
    { label: 'Plans', href: '#', icon: <Package className={iconClass} /> },
    { label: 'AI Builders', href: '#', icon: <Hammer className={iconClass} /> },
    { label: 'AI Providers', href: '#', icon: <Cpu className={iconClass} /> },
    { label: 'AI Templates', href: '#', icon: <LayoutTemplate className={iconClass} /> },
    { label: 'Landing Page', href: '#', icon: <Monitor className={iconClass} /> },
    { label: 'Plugins', href: '#', icon: <Puzzle className={iconClass} /> },
    { label: 'Languages', href: '#', icon: <Globe className={iconClass} /> },
    { label: 'Cronjobs', href: '#', icon: <Clock className={iconClass} /> },
    { label: 'Settings', href: '#', icon: <Settings2 className={iconClass} /> },
];

function AppLayoutFooter() {
    const { t } = useTranslation();
    return (
        <Link
            href={route('home')}
            className="block rounded-soft px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition duration-150"
        >
            ← {t('nav.backToHome')}
        </Link>
    );
}

export default function AppLayout({ title = 'Dashboard', header, children }) {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navGroups = [
        {
            type: 'group',
            label: 'Projects',
            items: projectsNav,
        },
        {
            type: 'group',
            label: 'Administration',
            items: administrationNav,
        },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                title={t('app.name')}
                navGroups={navGroups}
                footer={<AppLayoutFooter />}
            />

            <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
                <Topbar
                    showLogo={false}
                    title={title}
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

