'use client';

import { route } from '@/lib/route';
import { Link, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import BrandMark, { BrandName } from '@/components/BrandMark';

export default function LandingLayout({ children }) {
    const { t } = useTranslation();
    const page = usePage().props;
    const user = page?.auth?.user;
    const brand = page?.branding?.system_title || page?.system_title || 'CallMineAI';
    const year = new Date().getFullYear();

    return (
        <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-ink-950 dark:text-neutral-100">
            <header className="sticky top-0 z-30 border-b border-neutral-200/70 dark:border-white/5 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
                    <Link href={route('home')} className="flex items-center gap-1">
                        <BrandMark variant="light" className="h-9 w-9 dark:hidden" />
                        <BrandMark variant="dark" className="hidden h-9 w-9 dark:block" />
                        <span className="font-display text-lg font-bold tracking-tight"><BrandName brand={brand} /></span>
                    </Link>
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href={route('frontend.blog')} className="hidden rounded-lg px-3 py-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white sm:inline">{t('nav.blog') || 'Blog'}</Link>
                        {user ? (
                            <Link href={route('client.dashboard')} className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition">{t('nav.dashboard') || 'Dashboard'}</Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-lg px-3 py-2 font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white">{t('auth.login') || 'Log in'}</Link>
                                <Link href={route('register')} className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition">{t('welcome.get_started') || 'Get started'}</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-neutral-200 dark:border-white/5">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400 sm:flex-row sm:px-6 lg:px-8">
                    <p>© {year} {brand}. {t('frontend.all_rights_reserved') || 'AI voice calling agents & lead intelligence.'}</p>
                    <nav className="flex items-center gap-4">
                        <Link href={route('frontend.blog')} className="hover:text-neutral-900 dark:hover:text-white">{t('nav.blog') || 'Blog'}</Link>
                        <Link href={route('frontend.terms')} className="hover:text-neutral-900 dark:hover:text-white">{t('frontend.terms') || 'Terms'}</Link>
                        <Link href={route('frontend.privacy')} className="hover:text-neutral-900 dark:hover:text-white">{t('frontend.privacy') || 'Privacy'}</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
