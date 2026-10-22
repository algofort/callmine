'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { useTranslation } from 'react-i18next';
import { Coins, Plus, Pencil, Trash2, Check, Star } from 'lucide-react';
import { useMoney } from '@/lib/money';

const EMPTY = { name: '', credits: 100, price_cents: 1000, currency_code: 'USD', is_popular: false, is_active: true, sort_order: 0 };

function PackageModal({ open, initial, onClose }) {
    const editing = Boolean(initial?.id);
    const { data, setData, post, put, processing, errors, reset } = useForm(initial ?? EMPTY);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => { reset(); onClose(); }, preserveScroll: true };
        if (editing) put(route('admin.credit-packages.update', initial.id), opts);
        else post(route('admin.credit-packages.store'), opts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-4 font-display text-lg font-semibold text-neutral-900 dark:text-white">
                    {editing ? 'Edit credit package' : 'New credit package'}
                </h3>
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Name" error={errors.name}>
                        <input className="input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Credits" error={errors.credits}>
                            <input type="number" min="1" className="input" value={data.credits} onChange={(e) => setData('credits', Number(e.target.value))} />
                        </Field>
                        <Field label="Price (cents)" error={errors.price_cents}>
                            <input type="number" min="0" className="input" value={data.price_cents} onChange={(e) => setData('price_cents', Number(e.target.value))} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Currency" error={errors.currency_code}>
                            <input className="input" value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value.toUpperCase())} />
                        </Field>
                        <Field label="Sort order" error={errors.sort_order}>
                            <input type="number" className="input" value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} />
                        </Field>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <input type="checkbox" checked={data.is_popular} onChange={(e) => setData('is_popular', e.target.checked)} /> Popular
                        </label>
                        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} /> Active
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-ink-800">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{editing ? 'Save' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
        </label>
    );
}

export default function CreditPackagesIndex({ packages = [], pendingPurchases = [], stats = [] }) {
    const { t } = useTranslation();
    const money = useMoney();
    const [modal, setModal] = useState({ open: false, initial: null });

    const remove = (pkg) => {
        if (confirm(`Delete "${pkg.name}"?`)) router.delete(route('admin.credit-packages.destroy', pkg.id), { preserveScroll: true });
    };
    const approve = (p) => router.post(route('admin.credit-purchases.approve', p.id), {}, { preserveScroll: true });

    return (
        <AdminLayout title={t('admin.credit_packages') || 'Credit packages'}>
            <Head title={t('admin.credit_packages') || 'Credit packages'} />
            <style>{`.input{width:100%;border-radius:.5rem;border:1px solid rgb(228 228 231 / .8);background:transparent;padding:.5rem .75rem;font-size:.875rem}.dark .input{border-color:rgb(58 58 84)}`}</style>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">{t('admin.credit_packages') || 'Credit packages'}</h2>
                    </div>
                    <button onClick={() => setModal({ open: true, initial: null })} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                        <Plus className="h-4 w-4" /> New package
                    </button>
                </div>

                <PageOverview feature="admin-credit-packages" />

                <StatCards items={stats} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-display font-semibold text-neutral-900 dark:text-white">{pkg.name}</h3>
                                        {pkg.is_popular && <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-500/20 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:text-brand-300"><Star className="h-3 w-3" /> Popular</span>}
                                    </div>
                                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{pkg.credits.toLocaleString()}</p>
                                    <p className="text-xs text-neutral-500">credits · {money(pkg.price_cents, pkg.currency_code)}</p>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pkg.is_active ? 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300' : 'bg-neutral-100 text-neutral-500 dark:bg-ink-800'}`}>{pkg.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => setModal({ open: true, initial: pkg })} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                                <button onClick={() => remove(pkg)} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                            </div>
                        </div>
                    ))}
                    {packages.length === 0 && <p className="text-sm text-neutral-500">No credit packages yet.</p>}
                </div>

                {pendingPurchases.length > 0 && (
                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                        <h3 className="mb-3 font-display font-semibold text-neutral-900 dark:text-white">Pending credit purchases</h3>
                        <div className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {pendingPurchases.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-2.5">
                                    <div className="text-sm">
                                        <span className="font-medium text-neutral-900 dark:text-white">{p.client}</span>
                                        <span className="text-neutral-500"> · {p.credits.toLocaleString()} credits · {money(p.amount_cents, p.currency_code)}</span>
                                    </div>
                                    <button onClick={() => approve(p)} className="inline-flex items-center gap-1 rounded-soft bg-signal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-signal-600"><Check className="h-3.5 w-3.5" /> Approve</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PackageModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false, initial: null })} />
        </AdminLayout>
    );
}
