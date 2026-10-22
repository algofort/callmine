'use client';

import { Button, Input, Toggle } from '@/components/ui';
import PlanLimits from './PlanLimits';
import PlanFeatures from './PlanFeatures';

export default function PlanForm({
    data,
    setData,
    errors = {},
    processing,
    onSubmit,
    onCancel,
    isEdit,
}) {
    const yearlyEnabled = data.yearly_price_cents != null && data.yearly_price_cents !== '';

    const toggleYearly = (on) => {
        if (!on) setData('yearly_price_cents', null);
        else setData('yearly_price_cents', data.yearly_price_cents ?? 0);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* General Information */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    General Information
                </h4>
                <div className="space-y-4">
                    <Input
                        label="Plan Name"
                        value={data.name ?? ''}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        required
                    />
                    <Input
                        label="Slug"
                        value={data.slug ?? ''}
                        onChange={(e) => setData('slug', e.target.value)}
                        hint="Leave empty to auto-generate from name"
                        error={errors.slug}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Description
                        </label>
                        <textarea
                            value={data.description ?? ''}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Short description for the plan"
                        />
                        {errors.description && (
                            <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.description}</p>
                        )}
                    </div>
                    <Input
                        label="Currency"
                        value={data.currency_code ?? ''}
                        onChange={(e) => setData('currency_code', e.target.value.toUpperCase())}
                        error={errors.currency_code}
                        placeholder="USD"
                        required
                    />
                </div>
            </section>

            {/* Pricing */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Pricing</h4>
                <div className="space-y-4">
                    <Input
                        type="number"
                        min={0}
                        label="Monthly Price (cents)"
                        value={data.monthly_price_cents ?? ''}
                        onChange={(e) =>
                            setData('monthly_price_cents', e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        error={errors.monthly_price_cents}
                        required
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable Yearly Pricing
                        </span>
                        <Toggle
                            checked={yearlyEnabled}
                            onChange={toggleYearly}
                        />
                    </div>
                    {yearlyEnabled && (
                        <Input
                            type="number"
                            min={0}
                            label="Yearly Price (cents)"
                            value={data.yearly_price_cents ?? ''}
                            onChange={(e) =>
                                setData(
                                    'yearly_price_cents',
                                    e.target.value ? parseInt(e.target.value, 10) : null
                                )
                            }
                        />
                    )}
                    <Input
                        type="number"
                        min={0}
                        max={365}
                        label="Trial Days"
                        value={data.trial_days ?? 0}
                        onChange={(e) => setData('trial_days', parseInt(e.target.value, 10) || 0)}
                    />
                </div>
            </section>

            {/* Stripe Integration */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Stripe Integration
                </h4>
                <div className="bg-gray-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-4">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Find these IDs inside Stripe Dashboard → Products
                    </p>
                    <Input
                        label="Stripe Monthly Price ID"
                        value={data.stripe_monthly_id ?? ''}
                        onChange={(e) => setData('stripe_monthly_id', e.target.value)}
                        placeholder="price_..."
                    />
                    <Input
                        label="Stripe Yearly Price ID"
                        value={data.stripe_yearly_id ?? ''}
                        onChange={(e) => setData('stripe_yearly_id', e.target.value)}
                        placeholder="price_..."
                    />
                </div>
            </section>

            {/* Plan Limits */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Plan Limits</h4>
                <PlanLimits limits={data.limits} onChange={(limits) => setData('limits', limits)} />
            </section>

            {/* Feature List */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Feature List</h4>
                <PlanFeatures features={data.features} onChange={(features) => setData('features', features)} />
            </section>

            {/* Status toggles */}
            <section>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Status</h4>
                <div className="flex flex-wrap gap-6">
                    <Toggle
                        label="Active"
                        checked={data.enabled ?? true}
                        onChange={(v) => setData('enabled', v)}
                    />
                    <Toggle
                        label="Popular"
                        checked={data.popular ?? false}
                        onChange={(v) => setData('popular', v)}
                    />
                    <Toggle
                        label="Featured"
                        checked={data.featured ?? false}
                        onChange={(v) => setData('featured', v)}
                    />
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm">
                    {isEdit ? 'Save Plan' : 'Create Plan'}
                </Button>
            </div>
        </form>
    );
}
