'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import { Button, Card, Pagination } from '@/components/ui';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Head, Link, router } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';

export default function AdminPaymentsIndex({ payments, filters = {}, stats = [] }) {
    const { t } = useTranslation();
    return (
        <AdminLayout title={t('admin.payments')}>
            <Head title={`${t('admin.payments')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.payments')}</h2>
                    <Link
                        href={route('admin.subscriptions.index')}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        {t('admin.view_subscriptions')}
                    </Link>
                </div>
                <PageOverview feature="admin-payments" />
                <StatCards items={stats} />
                <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.target; router.get(route('admin.payments.index'), { status: f.status?.value, gateway: f.gateway?.value }, { preserveState: true }); }}>
                    <select name="status" className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" defaultValue={filters.status}>
                        <option value="">All statuses</option>
                        <option value="succeeded">Succeeded</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select name="gateway" className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" defaultValue={filters.gateway}>
                        <option value="">All gateways</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="paddle">Paddle</option>
                    </select>
                    <Button type="submit" variant="outline" size="sm">Filter</Button>
                </form>
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                                    <th className="pb-2 pr-4 font-medium">User</th>
                                    <th className="pb-2 pr-4 font-medium">Amount</th>
                                    <th className="pb-2 pr-4 font-medium">Gateway</th>
                                    <th className="pb-2 pr-4 font-medium">Status</th>
                                    <th className="pb-2 pr-4 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data?.map((t) => (
                                    <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{t.user ? `${t.user.name} (${t.user.email})` : '—'}</td>
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{(t.amount_cents / 100).toFixed(2)} {t.currency_code}</td>
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{t.gateway}</td>
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{t.status}</td>
                                        <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400">{t.created_at && new Date(t.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {payments.data?.length === 0 && <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">No payments.</div>}
                    <Pagination data={payments} />
                </Card>
            </div>
        </AdminLayout>
    );
}
