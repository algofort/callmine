'use client';

import { route } from '@/lib/route';
import { Link, router, usePage } from '@/lib/page-router';
import { Bell, BadgeCheck } from 'lucide-react';
import DemoBadge from '@/components/DemoBadge';
import { useTranslation } from 'react-i18next';
import ApplicationLogo from '@/components/ApplicationLogo';
import { Dropdown } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/hooks/useLocale';

/**
 * Topbar with language switcher, currency switcher, and account menu.
 * Locale/currency from shared page props; updates via PUT /locale and PUT /currency.
 */
const FALLBACK_CURRENCIES = [
    { code: 'USD', symbol: '$', decimals: 2 },
    { code: 'EUR', symbol: '€', decimals: 2 },
    { code: 'GBP', symbol: '£', decimals: 2 },
    { code: 'INR', symbol: '₹', decimals: 2 },
    { code: 'BDT', symbol: '৳', decimals: 2 },
];

export default function Topbar({
    showLogo = true,
    logoHref = route('home'),
    userNavItems = [],
    title,
    showWorkspace = true,
    extra = null,
}) {
    const { t } = useTranslation();
    const page = usePage();
    const user = page.props.auth?.user;
    const kycVerified = page.props.auth?.customer?.kyc_verified === true;
    // The customer notifications bell must never point into the client panel while
    // the admin panel is being viewed (Topbar is shared by both layouts).
    const isAdminArea = (() => { try { return route().current('admin.*'); } catch { return false; } })();
    const { theme, setTheme } = useTheme();

    const { locale: currentLocale, isRtl: currentIsRtl, locales: i18nLocales, setLocale: setLocaleCode } = useLocale();
    const localeEntries = i18nLocales.length
        ? i18nLocales.map((l) => [l.code, l.native_name || l.name])
        : Object.entries(page.props.supportedLocales ?? { en: 'English' });

    const handleThemeToggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        if (user) {
            router.post(route('theme.update'), { theme: next }, { preserveScroll: true });
        }
    };

    const currencies = page.props.currencies?.length ? page.props.currencies : FALLBACK_CURRENCIES;
    const currentCurrency = page.props.displayCurrency ?? 'USD';

    const handleLocale = (code) => {
        setLocaleCode(code);
    };

    const handleCurrency = (code) => {
        router.put(route('currency.update'), { currency: code }, { preserveScroll: true });
    };

    const defaultUserItems = [
        ...(user
            ? [
                { label: t('nav.profile'), href: route('client.profile.edit'), as: 'link' },
                { type: 'divider' },
                { label: t('nav.logout'), href: route('logout'), method: 'post', as: 'link' },
            ]
            : [
                { label: t('nav.login'), href: route('login'), as: 'link' },
                { label: t('nav.register'), href: route('register'), as: 'link' },
            ]),
    ];

    const accountItems = userNavItems.length ? userNavItems : defaultUserItems;

    const currentTenant = page.props.currentTenant;
    const tenants = page.props.tenants ?? [];

    const handleTenantSwitch = (tenantId) => {
        router.post(route('client.tenants.switch'), { tenant_id: tenantId }, { preserveScroll: true });
    };

    return (
        <header className="topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200/80 dark:border-ink-800 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-ink-950/60 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
                {showLogo && (
                    <Link href={logoHref} className="shrink-0">
                        <ApplicationLogo className="h-8 w-8" />
                    </Link>
                )}
                {title && (
                    <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</h1>
                )}
                <DemoBadge />
            </div>

            <div className="flex shrink-0 items-center gap-1">
                {extra}
                {user && !isAdminArea && page.props.notificationsUnread !== undefined && (
                    <Link href={route('client.alerts.notifications')} className="relative rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-200 transition" aria-label="Notifications">
                        <Bell className="h-5 w-5" />
                        {page.props.notificationsUnread > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{page.props.notificationsUnread > 9 ? '9+' : page.props.notificationsUnread}</span>
                        )}
                    </Link>
                )}
                {/* Theme toggle */}
                <button
                    type="button"
                    onClick={handleThemeToggle}
                    className="flex items-center justify-center rounded-soft p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition duration-200"
                    aria-label={t('topbar.switch_theme')}
                    title={t('topbar.switch_theme')}
                >
                    {theme === 'dark' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                </button>

                {/* Workspace (tenant) switcher */}
                {showWorkspace && user && (
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-soft px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition duration-150"
                                aria-label={t('topbar.workspace')}
                            >
                                <span className="text-base" aria-hidden>◫</span>
                                <span className="hidden max-w-[140px] truncate sm:inline">
                                    {currentTenant?.name ?? t('topbar.no_workspace')}
                                </span>
                                <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="56">
                            {tenants.length === 0 ? (
                                <Link
                                    href={route('client.tenants.index')}
                                    className="block px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30"
                                >
                                    {t('topbar.create_workspace')}
                                </Link>
                            ) : (
                                tenants.map((t) => (
                                    <Dropdown.Item
                                        key={t.id}
                                        as="button"
                                        onClick={() => handleTenantSwitch(t.id)}
                                        className={currentTenant?.id === t.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : ''}
                                    >
                                        {t.name}
                                    </Dropdown.Item>
                                ))
                            )}
                            <Dropdown.Divider />
                            <Link
                                href={route('client.tenants.index')}
                                className="block px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            >
                                {t('topbar.manage_workspaces')}
                            </Link>
                        </Dropdown.Content>
                    </Dropdown>
                )}

                {/* Language switcher */}
                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-soft px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition duration-150"
                            aria-label={t('topbar.language')}
                        >
                            <span className="text-base" aria-hidden>🌐</span>
                            <span className="hidden sm:inline">
                                {i18nLocales.find((l) => l.code === currentLocale)?.native_name ?? currentLocale.toUpperCase()}
                            </span>
                            {currentIsRtl && <span className="rounded bg-neutral-200 dark:bg-neutral-700 px-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">RTL</span>}
                            <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="right" width="48">
                        {localeEntries.map(([code, label]) => {
                            const isRtl = i18nLocales.find((l) => l.code === code)?.is_rtl ?? false;
                            return (
                                <Dropdown.Item
                                    key={code}
                                    as="button"
                                    onClick={() => handleLocale(code)}
                                    className={currentLocale === code ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : ''}
                                >
                                    <span>{label}</span>
                                    {isRtl && <span className="ms-1.5 rounded bg-neutral-200 dark:bg-neutral-700 px-1 text-[10px]">RTL</span>}
                                </Dropdown.Item>
                            );
                        })}
                    </Dropdown.Content>
                </Dropdown>

                {/* Currency switcher */}
                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-soft px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition duration-150"
                            aria-label={t('topbar.currency')}
                        >
                            <span className="hidden sm:inline">
                                {currencies.find((c) => c.code === currentCurrency)?.symbol ?? '$'}
                            </span>
                            <span>{currentCurrency}</span>
                            <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="right" width="48">
                        {currencies.map((c) => (
                            <Dropdown.Item
                                key={c.code}
                                as="button"
                                onClick={() => handleCurrency(c.code)}
                                className={currentCurrency === c.code ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : ''}
                            >
                                {c.symbol} {c.code}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Content>
                </Dropdown>

                {/* Account menu */}
                {user && (
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-soft px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition duration-150"
                                aria-label={t('topbar.account')}
                            >
                                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 text-xs font-medium">
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                    {kycVerified && <BadgeCheck className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-white text-signal-500 dark:bg-ink-950 dark:text-signal-400" strokeWidth={2.5} aria-label="Verified" />}
                                </span>
                                <span className="hidden max-w-[120px] truncate md:inline">{user.name || user.email}</span>
                                <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="56">
                            <div className="px-4 py-2 border-b border-soft border-gray-200 dark:border-neutral-700">
                                <p className="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                            </div>
                            {accountItems.map((item, i) =>
                                item.type === 'divider' ? (
                                    <Dropdown.Divider key={i} />
                                ) : item.as === 'link' ? (
                                    <Link
                                        key={i}
                                        href={item.href}
                                        method={item.method || 'get'}
                                        as="button"
                                        className="block w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 transition duration-150"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <Dropdown.Item key={i} as="button" onClick={item.onClick}>
                                        {item.label}
                                    </Dropdown.Item>
                                )
                            )}
                        </Dropdown.Content>
                    </Dropdown>
                )}
            </div>
        </header>
    );
}

