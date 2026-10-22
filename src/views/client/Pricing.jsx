'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Button, Card } from '@/components/ui';
import { Head, router, usePage } from '@/lib/page-router';
import { useState } from 'react';

/**
 * Pricing page: monthly/yearly toggle, plans with converted prices, checkout per gateway (or "Not configured").
 */
export default function Pricing({ plans = [], gateways = [], flash = {} }) {
    const [billingCycle, setBillingCycle] = useState('month');
    const [loadingGateway, setLoadingGateway] = useState(null);
    const { url } = usePage();

    const hasSuccess = url.includes('checkout=success');
    const hasCanceled = url.includes('checkout=canceled');
    const flashError = flash?.error;
    const flashSuccess = flash?.success;

    const configuredGateways = gateways.filter((g) => g.configured);

    const handleCheckout = (planId, gatewayKey) => {
        if (!planId || !gatewayKey) return;
        const loadingKey = `${planId}-${gatewayKey}`;
        setLoadingGateway(loadingKey);
        router.post(route('client.checkout.store'), {
            plan_id: planId,
            billing_cycle: billingCycle,
            gateway: gatewayKey,
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingGateway(null),
        });
    };

    return (
        <ClientLayout title="Pricing">
            <Head title="Pricing" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Plans</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Choose monthly or yearly billing. Prices in your selected display currency.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-soft-lg border border-soft border-neutral-200 bg-neutral-50 p-1">
                        <button
                            type="button"
                            onClick={() => setBillingCycle('month')}
                            className={`rounded-soft px-3 py-1.5 text-sm font-medium transition ${billingCycle === 'month' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-soft' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('year')}
                            className={`rounded-soft px-3 py-1.5 text-sm font-medium transition ${billingCycle === 'year' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-soft' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                {(flashError || hasCanceled) && (
                    <div className="rounded-soft-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flashError || 'Checkout was canceled.'}
                    </div>
                )}
                {(flashSuccess || hasSuccess) && (
                    <div className="rounded-soft-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flashSuccess || 'Payment successful. Your subscription is active.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const priceDisplay = billingCycle === 'year' ? plan.yearly_price_display : plan.monthly_price_display;
                        const isFree = plan.is_free;

                        return (
                            <Card key={plan.id} className="flex flex-col">
                                <Card.Body className="flex flex-1 flex-col">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{plan.name}</h3>
                                    <p className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
                                        {priceDisplay ?? '—'}
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500">
                                        per {billingCycle === 'year' ? 'year' : 'month'}
                                    </p>
                                    <ul className="mt-4 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                                        <li>{plan.ai_credits} AI credits</li>
                                        {plan.export_enabled && <li>Export</li>}
                                        {plan.custom_domain_enabled && <li>Custom domain</li>}
                                        {plan.white_label_enabled && <li>White label</li>}
                                    </ul>

                                    {!isFree && (
                                        <div className="mt-6 space-y-2">
                                            {configuredGateways.length === 0 ? (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-soft px-3 py-2">
                                                    No payment gateway configured. Contact support.
                                                </p>
                                            ) : (
                                                configuredGateways.map((gw) => {
                                                    const buttonKey = `${plan.id}-${gw.key}`;
                                                    const isThisLoading = loadingGateway === buttonKey;
                                                    return (
                                                        <Button
                                                            key={buttonKey}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            disabled={loadingGateway !== null}
                                                            onClick={() => handleCheckout(plan.id, gw.key)}
                                                        >
                                                            {isThisLoading ? 'Redirecting…' : `Pay with ${gw.name}`}
                                                        </Button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                    {isFree && (
                                        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Free plan — no payment required.</p>
                                    )}
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>

                {gateways.length > 0 && (
                    <div className="rounded-soft-lg border border-soft border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="font-medium">Payment gateways: </span>
                        {gateways.map((g) => (
                            <span key={g.key} className="mr-2">
                                {g.name} {g.configured ? '✓' : '(not configured)'}
                            </span>
                        ))}
                    </div>
                )}

                {!plans?.length && (
                    <Card>
                        <Card.Body>
                            <p className="text-neutral-500 dark:text-neutral-400">No plans available. Run the plan seeder to see pricing.</p>
                        </Card.Body>
                    </Card>
                )}
            </div>
        </ClientLayout>
    );
}


