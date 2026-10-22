'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, Link, router } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { usePage } from '@/lib/page-router';
import { Package, ArrowRightCircle, CreditCard } from 'lucide-react';

function formatDate(iso) {
    if (!iso) return null;
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return iso;
    }
}

export default function SubscriptionShow({ subscription, canCancel, canUpgrade }) {
    const { t } = useTranslation();
    const { flash } = usePage().props;

    const handleCancel = () => {
        if (!confirm(t('client.cancel_subscription_confirm') || 'Are you sure you want to cancel your subscription?')) return;
        router.delete(route('client.subscription.destroy'));
    };

    return (
        <ClientLayout title={t('client.subscription') || 'Subscription'}>
            <Head title={t('client.subscription') || 'Subscription'} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {t('client.subscription') || 'Subscription'}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('client.subscription_subtitle') || 'Your current plan and billing'}
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
                        {flash.error}
                    </div>
                )}

                {subscription ? (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                                    <Package className="h-6 w-6" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        {subscription.plan.name}
                                    </h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {subscription.status === 'active'
                                            ? (t('client.plan_active') || 'Active')
                                            : subscription.status}
                                        {subscription.renews_at &&
                                            ` · ${t('client.renews') || 'Renews'} ${formatDate(subscription.renews_at)}`}
                                        {subscription.ends_at && !subscription.renews_at &&
                                            ` · ${t('client.ends') || 'Ends'} ${formatDate(subscription.ends_at)}`}
                                    </p>
                                    {subscription.managed_by_admin && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            {t('client.managed_by_admin') || 'Managed by your organization admin'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {canUpgrade && !subscription.managed_by_admin && (
                                    <Link
                                        href={route('client.pricing')}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                                    >
                                        {t('client.upgrade_plan') || 'Upgrade plan'}
                                        <ArrowRightCircle className="h-4 w-4" />
                                    </Link>
                                )}
                                {canCancel && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="inline-flex items-center rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                    >
                                        {t('client.cancel_subscription') || 'Cancel subscription'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 text-center">
                        <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                            {t('client.no_plan') || 'No active subscription'}
                        </p>
                        <Link
                            href={route('client.pricing')}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                        >
                            <CreditCard className="h-4 w-4" />
                            {t('client.view_plans') || 'View plans'}
                        </Link>
                    </div>
                )}

                <Link
                    href={route('client.billing.index')}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <CreditCard className="h-4 w-4" />
                    {t('client.view_billing_history') || 'View billing history'}
                </Link>
            </div>
        </ClientLayout>
    );
}
