'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Head, Link, router, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { CreditCard, Package, PhoneCall, Star, Check } from 'lucide-react';
import { useMoney } from '@/lib/money';

function formatDate(iso) {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return iso; }
}
const USAGE_LABELS = { agents: 'Agents', campaigns: 'Campaigns', contacts: 'Contacts', numbers: 'Phone numbers', kb_mb: 'Knowledge base (MB)' };

function UsageBar({ label, usage, limit }) {
    const unlimited = limit === null || limit >= 9999;
    const pct = unlimited || !limit ? 0 : Math.min(100, Math.round((usage / limit) * 100));
    return (
        <div>
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{label}</span>
                <span className="font-mono tabular-nums">{usage}{unlimited ? '' : ` / ${limit}`}</span>
            </div>
            {!unlimited && (
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-ink-800">
                    <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
                </div>
            )}
        </div>
    );
}

export default function BillingIndex({ transactions, stats = [], creditBalance = 0, creditPackages = [], creditHistory = [], planUsage = null }) {
    const { t } = useTranslation();
    const { url } = usePage();
    const money = useMoney();
    const hasCheckoutSuccess = url.includes('checkout=success');

    const buy = (pkg) => {
        if (confirm(`Request ${pkg.credits.toLocaleString()} credits for ${money(pkg.price_cents, pkg.currency_code)}?`)) {
            router.post(route('client.billing.credits.purchase'), { credit_package_id: pkg.id }, { preserveScroll: true });
        }
    };

    return (
        <ClientLayout title={t('client.billing') || 'Billing & Credits'}>
            <Head title={t('client.billing') || 'Billing & Credits'} />
            <div className="space-y-6">
                {hasCheckoutSuccess && (
                    <div className="rounded-soft-lg border border-signal-200 bg-signal-50 dark:bg-signal-900/20 dark:border-signal-800 px-4 py-3 text-sm text-signal-800 dark:text-signal-200">
                        Payment successful. Your subscription is active.
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{t('client.billing') || 'Billing & Credits'}</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('client.billing_history') || 'Credits, plan usage and payment history'}</p>
                    </div>
                    <Link href={route('client.pricing')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                        <CreditCard className="h-4 w-4" /> {t('client.view_plans') || 'View plans'}
                    </Link>
                </div>

                <PageOverview feature="billing" />

                <StatCards items={stats} />

                {/* Balance + plan usage */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-soft">
                        <div className="flex items-center gap-2 text-brand-100"><PhoneCall className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Calling credits</span></div>
                        <p className="mt-2 font-mono text-4xl font-bold tabular-nums">{Number(creditBalance).toLocaleString()}</p>
                        <p className="mt-1 text-xs text-brand-100">≈ {Number(creditBalance).toLocaleString()} call minutes remaining</p>
                    </div>
                    {planUsage && (
                        <div className="lg:col-span-2 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Plan usage</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(planUsage).map(([key, u]) => (
                                    <UsageBar key={key} label={USAGE_LABELS[key] || key} usage={u.usage} limit={u.limit} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Credit packages */}
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Buy credits</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {creditPackages.map((pkg) => (
                            <div key={pkg.id} className={`relative rounded-soft-lg border bg-white dark:bg-ink-900 p-5 shadow-soft ${pkg.is_popular ? 'border-brand-400 dark:border-brand-500' : 'border-neutral-200 dark:border-ink-800'}`}>
                                {pkg.is_popular && <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white"><Star className="h-3 w-3" /> Popular</span>}
                                <h3 className="font-display font-semibold text-neutral-900 dark:text-white">{pkg.name}</h3>
                                <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">{pkg.credits.toLocaleString()}</p>
                                <p className="text-xs text-neutral-500">credits</p>
                                <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{money(pkg.price_cents, pkg.currency_code)}</p>
                                <button onClick={() => buy(pkg)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                                    <Check className="h-4 w-4" /> Buy credits
                                </button>
                            </div>
                        ))}
                        {creditPackages.length === 0 && <p className="text-sm text-neutral-500">No credit packages available.</p>}
                    </div>
                </div>

                {/* Credit history */}
                {creditHistory.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Credit history</h2>
                        <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                                <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                    {creditHistory.map((l) => (
                                        <tr key={l.id}>
                                            <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{formatDate(l.created_at)}</td>
                                            <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300 capitalize">{(l.reason || '').replace(/_/g, ' ')}{l.note ? <span className="text-neutral-400"> · {l.note}</span> : null}</td>
                                            <td className={`px-4 py-2.5 text-right font-mono tabular-nums font-medium ${l.delta >= 0 ? 'text-signal-600 dark:text-signal-400' : 'text-danger'}`}>{l.delta >= 0 ? '+' : ''}{l.delta.toLocaleString()}</td>
                                            <td className="px-4 py-2.5 text-right font-mono tabular-nums text-neutral-500">{l.balance_after.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Payment transactions */}
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Payment history</h2>
                    <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                        {transactions.data?.length > 0 ? (
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                                <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                    <tr>
                                        {['Date', 'Amount', 'Plan', 'Status'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                    {transactions.data.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-neutral-900 dark:text-white">{formatDate(tx.created_at)}</td>
                                            <td className="px-4 py-3 text-neutral-900 dark:text-white">{money(tx.amount_cents, tx.currency_code)}</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{tx.plan?.name ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${['completed', 'succeeded', 'paid'].includes(tx.status) ? 'bg-signal-100 text-signal-700 dark:bg-signal-900/30 dark:text-signal-300' : 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300'}`}>{tx.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                <Package className="mx-auto mb-3 h-12 w-12 text-neutral-400" />
                                <p>{t('client.no_payments') || 'No payments yet'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
