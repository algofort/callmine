'use client';

import { route } from '@/lib/route';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import PageOverview from '@/components/PageOverview';
import SetupGuide from '@/components/SetupGuide';
import StatCards from '@/components/StatCards';
import { Table, ExternalLink, Mail, Unplug, CheckCircle2, XCircle, FileText, CalendarClock } from 'lucide-react';

function StatusBadge({ connected }) {
    return connected ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-50 px-3 py-1 text-xs font-medium text-signal-700 dark:bg-signal-500/10 dark:text-signal-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Connected
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500 dark:bg-ink-800 dark:text-neutral-400">
            <XCircle className="h-3.5 w-3.5" /> Not connected
        </span>
    );
}

function Toggle({ label, description, icon: Icon, checked, onChange, disabled }) {
    return (
        <label className="flex items-start justify-between gap-4 rounded-soft border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4">
            <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-ink-700'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </label>
    );
}

export default function GoogleSheetsIndex({ config = {}, stats = [] }) {
    const { t } = useTranslation();
    const settings = useForm({
        sync_forms: config.sync_forms ?? false,
        sync_appointments: config.sync_appointments ?? false,
    });

    const connect = () => router.post(route('client.google-sheets.connect'), {}, { preserveScroll: true });
    const disconnect = () => {
        if (confirm('Disconnect Google Sheets? Sync will stop.')) {
            router.post(route('client.google-sheets.disconnect'), {}, { preserveScroll: true });
        }
    };
    const saveToggle = (field, value) => {
        settings.setData(field, value);
        router.put(
            route('client.google-sheets.update'),
            { sync_forms: settings.data.sync_forms, sync_appointments: settings.data.sync_appointments, [field]: value },
            { preserveScroll: true }
        );
    };

    return (
        <ClientLayout title={t('nav.google_sheets') !== 'nav.google_sheets' ? t('nav.google_sheets') : 'Google Sheets'}>
            <Head title="Google Sheets" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Google Sheets</h1>
                            <StatusBadge connected={config.connected} />
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Automatically export form submissions and appointments to a Google spreadsheet.</p>
                    </div>
                </div>

                <PageOverview feature="google-sheets" />

                <SetupGuide guide="google-sheets" />
                <StatCards items={stats} />

                {!config.connected ? (
                    <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-8 text-center shadow-soft">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-soft-lg bg-brand-50 dark:bg-brand-500/10">
                            <Table className="h-7 w-7 text-brand-600 dark:text-brand-400" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">Connect Google Sheets</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
                            Link a Google account to sync your data into a spreadsheet in real time. We&apos;ll create a dedicated sheet and keep it up to date as new form submissions and appointments arrive.
                        </p>
                        <button
                            onClick={connect}
                            className="mt-5 inline-flex items-center gap-2 rounded-soft bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500"
                        >
                            <Table className="h-4 w-4" /> Connect Google Sheets
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                                        <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                                        <span className="font-medium">{config.account_email}</span>
                                    </div>
                                    {config.spreadsheet_url && (
                                        <a
                                            href={config.spreadsheet_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400"
                                        >
                                            <Table className="h-4 w-4" /> Open spreadsheet <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    {config.last_synced_human && (
                                        <p className="text-xs text-neutral-400">Last synced {config.last_synced_human}</p>
                                    )}
                                </div>
                                <button
                                    onClick={disconnect}
                                    className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                                >
                                    <Unplug className="h-4 w-4" /> Disconnect
                                </button>
                            </div>
                        </div>

                        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                            <h3 className="font-display text-base font-semibold text-neutral-900 dark:text-white">Sync settings</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose which records are pushed to your spreadsheet.</p>
                            <div className="mt-4 space-y-3">
                                <Toggle
                                    label="Sync form submissions"
                                    description="Append each new form submission as a row."
                                    icon={FileText}
                                    checked={settings.data.sync_forms}
                                    disabled={settings.processing}
                                    onChange={(v) => saveToggle('sync_forms', v)}
                                />
                                <Toggle
                                    label="Sync appointments"
                                    description="Append booked appointments as they are scheduled."
                                    icon={CalendarClock}
                                    checked={settings.data.sync_appointments}
                                    disabled={settings.processing}
                                    onChange={(v) => saveToggle('sync_appointments', v)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
