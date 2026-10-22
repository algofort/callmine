'use client';

import { usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';

/**
 * Compact "Demo mode" badge for the Topbar (shown on both panels when
 * APP_DEMO_MODE is on). Amber, with a pulsing dot; the label collapses to the
 * icon on small screens. Signals that create/update/delete is disabled.
 */
export default function DemoBadge() {
    const { t } = useTranslation();
    const demoMode = usePage().props.demo_mode === true;
    if (!demoMode) return null;

    const tip = t('demo.banner') !== 'demo.banner'
        ? t('demo.banner')
        : 'Demo mode — changes are disabled';

    return (
        <span
            title={tip}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
        >
            <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            <FlaskConical className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">{t('demo.badge') !== 'demo.badge' ? t('demo.badge') : 'Demo mode'}</span>
        </span>
    );
}
