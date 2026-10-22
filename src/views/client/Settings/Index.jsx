'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Button } from '@/components/ui';
import PageOverview from '@/components/PageOverview';
import { Head, useForm, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon } from 'lucide-react';

export default function ClientSettingsIndex({
    preferences = {},
    supportedLocales = [],
    supportedCurrencies = [],
    client = null,
}) {
    const { t } = useTranslation();
    const { flash = {}, demo_mode = false } = usePage().props;
    const form = useForm({
        locale: preferences.locale ?? 'en',
        display_currency: preferences.display_currency ?? 'USD',
        theme: preferences.theme ?? 'light',
        client_name: client?.name ?? '',
        client_email: client?.email ?? '',
        client_phone: client?.phone ?? '',
        client_address: client?.address ?? '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put(route('client.settings.update'));
    };

    return (
        <ClientLayout title={t('client.settings') || 'Settings'}>
            <Head title={t('client.settings') || 'Settings'} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {t('client.settings') || 'Settings'}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('client.settings_subtitle') || 'Preferences and organization'}
                    </p>
                </div>

                <PageOverview feature="settings" />

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            {t('client.preferences') || 'Preferences'}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.language') || 'Language'}
                                </label>
                                <select
                                    value={form.data.locale}
                                    onChange={e => form.setData('locale', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    disabled={demo_mode}
                                >
                                    {supportedLocales.map((l) => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.display_currency') || 'Display currency'}
                                </label>
                                <select
                                    value={form.data.display_currency}
                                    onChange={e => form.setData('display_currency', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    disabled={demo_mode}
                                >
                                    {supportedCurrencies.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} {c.symbol ? `(${c.symbol})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.theme') || 'Theme'}
                                </label>
                                <select
                                    value={form.data.theme}
                                    onChange={e => form.setData('theme', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    disabled={demo_mode}
                                >
                                    <option value="light">{t('client.theme_light') || 'Light'}</option>
                                    <option value="dark">{t('client.theme_dark') || 'Dark'}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {client && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                {t('client.organization') || 'Organization'}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.organization_name') || 'Organization name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.client_name}
                                        onChange={e => form.setData('client_name', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        disabled={demo_mode}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.organization_email') || 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        value={form.data.client_email}
                                        onChange={e => form.setData('client_email', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        disabled={demo_mode}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.phone') || 'Phone'}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.client_phone}
                                        onChange={e => form.setData('client_phone', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        disabled={demo_mode}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.address') || 'Address'}
                                    </label>
                                    <textarea
                                        value={form.data.client_address}
                                        onChange={e => form.setData('client_address', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        disabled={demo_mode}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!demo_mode && (
                        <Button type="submit" variant="primary" disabled={form.processing}>
                            {t('client.save_settings') || 'Save settings'}
                        </Button>
                    )}
                </form>
            </div>
        </ClientLayout>
    );
}
