'use client';

import ClientLayout from '@/layouts/ClientLayout';
import { Head } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';

export default function MarketingSection({ pageTitle = '' }) {
    const { t } = useTranslation();

    return (
        <ClientLayout title={pageTitle}>
            <Head title={pageTitle} />
            <div className="w-full max-w-none space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                        <Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{pageTitle}</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('client.marketing.placeholder_subtitle')}
                        </p>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
