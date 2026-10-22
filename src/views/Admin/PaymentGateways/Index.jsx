'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import PaymentGatewayEditModal from '@/components/PaymentGatewayEditModal';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Button, Card } from '@/components/ui';
import { Head, router, usePage } from '@/lib/page-router';
import axios from 'axios';

export default function AdminPaymentGatewaysIndex({ gateways = [], stats = [], flash = {} }) {
    const { props } = usePage();
    const validationErrors = props.errors ?? {};
    const [editGateway, setEditGateway] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const openEdit = async (gatewayKey) => {
        setEditGateway(gatewayKey);
        setFetchError(null);
        setFormData(null);
        setLoading(true);
        try {
            const { data } = await axios.get(route('admin.payment-gateways.show', gatewayKey));
            setFormData(data);
        } catch (e) {
            setFetchError(e?.response?.data?.message || 'Failed to load gateway config');
        } finally {
            setLoading(false);
        }
    };

    const closeEdit = () => {
        setEditGateway(null);
        setFormData(null);
        setFetchError(null);
    };

    return (
        <AdminLayout title="Payment Gateways">
            <Head title="Payment Gateways · Admin" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Payment Gateways</h2>
                    <a
                        href={route('admin.payments.index')}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        View payments →
                    </a>
                </div>
                <PageOverview feature="admin-payment-gateways" />
                <StatCards items={stats} />
                {flash?.success && (
                    <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                        {flash.success}
                    </div>
                )}
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Configure payment gateways from the database. When configured here, these settings override .env. Both test and live
                    credentials are stored securely.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gateways.map((g) => (
                        <Card key={g.gateway}>
                            <Card.Body className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{g.name}</h3>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            g.configured
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                                        }`}
                                    >
                                        {g.configured ? 'Configured' : 'Not configured'}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    {g.enabled ? 'Enabled' : 'Disabled'} · {g.test_mode ? 'Test mode' : 'Live mode'} ·{' '}
                                    {g.recurring ? 'Recurring' : 'One-time'}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => openEdit(g.gateway)}
                                >
                                    Edit gateway
                                </Button>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
                <PaymentGatewayEditModal
                    show={!!editGateway}
                    gatewayKey={editGateway}
                    initialData={formData}
                    loading={loading}
                    error={fetchError}
                    validationErrors={validationErrors}
                    onClose={closeEdit}
                    onSaved={() => {
                        closeEdit();
                        router.reload();
                    }}
                    buildShowUrl={(key) => route('admin.payment-gateways.show', key)}
                    buildUpdateUrl={(key) => route('admin.payment-gateways.update', key)}
                />
            </div>
        </AdminLayout>
    );
}
