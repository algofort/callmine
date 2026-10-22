'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import SetupGuide from '@/components/SetupGuide';
import { Button, Card, Input, Toggle } from '@/components/ui';
import { Head, useForm, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';

const truthy = (v) => v === '1' || v === true || v === 'true';

const FIREBASE_FIELDS = [
    { key: 'firebase_api_key', label: 'API key', required: true, placeholder: 'AIza…' },
    { key: 'firebase_auth_domain', label: 'Auth domain', required: true, placeholder: 'your-app.firebaseapp.com' },
    { key: 'firebase_project_id', label: 'Project ID', required: true, placeholder: 'your-app' },
    { key: 'firebase_app_id', label: 'App ID', required: true, placeholder: '1:1234567890:web:abc123' },
    { key: 'firebase_messaging_sender_id', label: 'Messaging sender ID', required: false, placeholder: '1234567890' },
    { key: 'firebase_storage_bucket', label: 'Storage bucket', required: false, placeholder: 'your-app.appspot.com' },
];

export default function SocialLoginIndex({ settings = {} }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        social_login_enabled: truthy(settings.social_login_enabled),
        social_login_google_enabled: truthy(settings.social_login_google_enabled),
        firebase_api_key: settings.firebase_api_key ?? '',
        firebase_auth_domain: settings.firebase_auth_domain ?? '',
        firebase_project_id: settings.firebase_project_id ?? '',
        firebase_app_id: settings.firebase_app_id ?? '',
        firebase_messaging_sender_id: settings.firebase_messaging_sender_id ?? '',
        firebase_storage_bucket: settings.firebase_storage_bucket ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.social-login.update'), { preserveScroll: true });
    };

    const title = t('admin.social_login') || 'Social login';

    return (
        <AdminLayout title={title}>
            <Head title={title} />

            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{title}</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('admin.social_login_subtitle') || 'Configure Firebase-powered social sign-in for the client login page.'}
                    </p>
                </div>

                <PageOverview feature="admin-social-login" />

                <SetupGuide guide="firebase" />

                {(flashSuccess || recentlySuccessful) && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {flashSuccess || t('common.saved') || 'Saved.'}
                    </div>
                )}

                <Card className="space-y-5 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {t('admin.social_login_enable') || 'Enable social login'}
                            </h2>
                            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                {t('admin.social_login_enable_help') || 'When on, the configured providers appear on the client login page.'}
                            </p>
                        </div>
                        <Toggle checked={data.social_login_enabled} onChange={(v) => setData('social_login_enabled', v)} />
                    </div>

                    <div className="flex items-start justify-between gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                                </svg>
                            </span>
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Google</span>
                        </div>
                        <Toggle checked={data.social_login_google_enabled} onChange={(v) => setData('social_login_google_enabled', v)} />
                    </div>
                </Card>

                <Card className="space-y-4 p-5 sm:p-6">
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('admin.firebase_config') || 'Firebase web config'}
                        </h2>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('admin.firebase_config_help') || 'From Firebase console → Project settings → Your apps → Web app → SDK setup (config). These values are public.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {FIREBASE_FIELDS.map((f) => (
                            <div key={f.key}>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {f.label}
                                    {f.required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
                                </label>
                                <Input
                                    value={data[f.key]}
                                    onChange={(e) => setData(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                />
                                {errors[f.key] && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors[f.key]}</p>}
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? (t('common.saving') || 'Saving…') : (t('common.save') || 'Save changes')}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
