'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { Button, Card, Input } from '@/components/ui';
import ThemedSelect from '@/components/ui/ThemedSelect';
import FileInput from '@/components/FileInput';
import { Head, useForm, usePage } from '@/lib/page-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Matches `Components/ui/Input` label + control spacing. */
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

/** Matches `Components/ui/Input` textarea / text control surface. */
const controlClass =
    'w-full rounded-soft border border-soft border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-inner transition duration-150 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-60';

function RequiredMark() {
    return (
        <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden>
            *
        </span>
    );
}

function SelectField({ id, label, required, error, children }) {
    return (
        <div className="w-full">
            <label htmlFor={id} className={labelClass}>
                {label}
                {required ? <RequiredMark /> : null}
            </label>
            {children}
            {error ? <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p> : null}
        </div>
    );
}

function colorPickerValue(hex) {
    const h = (hex || '#0284c7').trim();
    if (/^#[0-9A-Fa-f]{6}$/i.test(h)) {
        return h;
    }
    if (/^#[0-9A-Fa-f]{3}$/i.test(h)) {
        const x = h.slice(1);

        return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`;
    }

    return '#0284c7';
}

export default function AdminGeneralSettingsIndex({
    settings = {},
    timezones = [],
    countries = [],
    locales = [],
    currencies = [],
}) {
    const { t } = useTranslation();
    const { flash } = usePage().props;
    const permissions = usePage().props.auth?.permissions ?? [];
    const canManage = permissions.includes('manage_settings');

    const form = useForm({
        system_title: settings.system_title ?? '',
        company_name: settings.company_name ?? '',
        tagline: settings.tagline ?? '',
        email: settings.email ?? '',
        timezone: settings.timezone ?? 'UTC',
        default_locale: settings.default_locale ?? 'en',
        country: settings.country ?? 'BD',
        default_currency: settings.default_currency ?? 'USD',
        primary_color: settings.primary_color ?? '#0284c7',
        favicon: null,
        site_logo: null,
    });

    const v = settings.updated_at ?? 0;
    const faviconPreviewSrc = useMemo(() => {
        if (form.data.favicon instanceof File) {
            return URL.createObjectURL(form.data.favicon);
        }
        return settings.favicon_url ? `${settings.favicon_url}?v=${v}` : null;
    }, [form.data.favicon, settings.favicon_url, v]);

    const logoPreviewSrc = useMemo(() => {
        if (form.data.site_logo instanceof File) {
            return URL.createObjectURL(form.data.site_logo);
        }
        return settings.site_logo_url ? `${settings.site_logo_url}?v=${v}` : null;
    }, [form.data.site_logo, settings.site_logo_url, v]);

    useEffect(() => {
        return () => {
            if (form.data.favicon instanceof File && faviconPreviewSrc?.startsWith('blob:')) {
                URL.revokeObjectURL(faviconPreviewSrc);
            }
            if (form.data.site_logo instanceof File && logoPreviewSrc?.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreviewSrc);
            }
        };
    }, [form.data.favicon, form.data.site_logo, faviconPreviewSrc, logoPreviewSrc]);

    const submit = (e) => {
        e.preventDefault();
        if (! canManage) {
            return;
        }
        form.post(route('admin.general-settings.update'), { forceFormData: true });
    };

    const fileInputClass =
        'block w-full text-sm text-neutral-600 file:mr-3 file:rounded-soft file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 file:shadow-inner transition file:duration-150 hover:file:bg-brand-100 dark:text-neutral-400 dark:file:bg-brand-900/35 dark:file:text-brand-200';

    const fileInputBorderWrap =
        'mt-1.5 rounded-soft border border-soft border-neutral-200 bg-white px-3 py-2.5 shadow-inner dark:border-neutral-700 dark:bg-neutral-900/30';

    return (
        <AdminLayout title={t('admin.general_settings')}>
            <Head title={`${t('admin.general_settings')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.general_settings')}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.general_settings_subtitle')}</p>
                </div>
                <PageOverview feature="admin-general-settings" />
                {flash?.success && (
                    <div className="rounded-soft-lg bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit}>
                    <Card>
                        <Card.Body className="space-y-6">
                            {/* Row 1 — image-style 4-col grid; 3 fields + tagline spans 2 on xl */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <Input
                                    id="system_title"
                                    label={
                                        <span className="inline-flex items-center">
                                            {t('admin.general_system_title')}
                                            <RequiredMark />
                                        </span>
                                    }
                                    value={form.data.system_title}
                                    onChange={(e) => form.setData('system_title', e.target.value)}
                                    error={form.errors.system_title}
                                    disabled={! canManage}
                                    required
                                />
                                <Input
                                    id="company_name"
                                    label={
                                        <span className="inline-flex items-center">
                                            {t('admin.general_company_name')}
                                            <RequiredMark />
                                        </span>
                                    }
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    error={form.errors.company_name}
                                    disabled={! canManage}
                                    required
                                />
                                <div className="w-full sm:col-span-2 xl:col-span-2">
                                    <Input
                                        id="tagline"
                                        type="text"
                                        label={t('admin.general_tagline')}
                                        value={form.data.tagline}
                                        onChange={(e) => form.setData('tagline', e.target.value)}
                                        error={form.errors.tagline}
                                        disabled={! canManage}
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    id="email"
                                    type="email"
                                    label={
                                        <span className="inline-flex items-center">
                                            {t('admin.general_email')}
                                            <RequiredMark />
                                        </span>
                                    }
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    error={form.errors.email}
                                    disabled={! canManage}
                                    required
                                />
                                <SelectField
                                    id="timezone"
                                    label={t('admin.general_timezone')}
                                    required
                                    error={form.errors.timezone}
                                >
                                    <ThemedSelect
                                        id="timezone"
                                        value={form.data.timezone}
                                        onChange={(val) => form.setData('timezone', val)}
                                        options={timezones}
                                        placeholder={t('admin.general_select_placeholder')}
                                        disabled={! canManage}
                                    />
                                </SelectField>
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SelectField
                                    id="default_locale"
                                    label={t('admin.general_default_language')}
                                    required
                                    error={form.errors.default_locale}
                                >
                                    <ThemedSelect
                                        id="default_locale"
                                        value={form.data.default_locale}
                                        onChange={(val) => form.setData('default_locale', val)}
                                        options={locales}
                                        placeholder={t('admin.general_select_placeholder')}
                                        disabled={! canManage}
                                    />
                                </SelectField>
                                <SelectField
                                    id="country"
                                    label={t('admin.general_country')}
                                    required
                                    error={form.errors.country}
                                >
                                    <ThemedSelect
                                        id="country"
                                        value={form.data.country}
                                        onChange={(val) => form.setData('country', val)}
                                        options={countries}
                                        placeholder={t('admin.general_select_placeholder')}
                                        disabled={! canManage}
                                    />
                                </SelectField>
                                <SelectField
                                    id="default_currency"
                                    label={t('admin.general_default_currency')}
                                    required
                                    error={form.errors.default_currency}
                                >
                                    <ThemedSelect
                                        id="default_currency"
                                        value={form.data.default_currency}
                                        onChange={(val) => form.setData('default_currency', val)}
                                        options={currencies}
                                        placeholder={t('admin.general_select_placeholder')}
                                        disabled={! canManage}
                                    />
                                </SelectField>
                                <div className="w-full">
                                    <label htmlFor="primary_color_hex" className={labelClass}>
                                        {t('admin.general_primary_color')}
                                        <RequiredMark />
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            id="primary_color"
                                            type="color"
                                            className="h-10 w-14 shrink-0 cursor-pointer rounded-soft border border-soft border-neutral-300 bg-white p-0.5 shadow-inner dark:border-neutral-600 dark:bg-neutral-800"
                                            value={colorPickerValue(form.data.primary_color)}
                                            onChange={(e) => form.setData('primary_color', e.target.value)}
                                            disabled={! canManage}
                                            aria-label={t('admin.general_primary_color')}
                                        />
                                        <input
                                            id="primary_color_hex"
                                            type="text"
                                            className={[controlClass, 'min-w-0 flex-1 max-w-full font-mono text-sm'].join(' ')}
                                            value={form.data.primary_color}
                                            onChange={(e) => form.setData('primary_color', e.target.value)}
                                            disabled={! canManage}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {form.errors.primary_color ? (
                                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{form.errors.primary_color}</p>
                                    ) : null}
                                </div>
                            </div>

                            {/* Row 4 — uploads */}
                            <fieldset disabled={! canManage} className="grid grid-cols-1 gap-6 border-0 p-0 lg:grid-cols-2">
                                <legend className="sr-only">{t('admin.general_media_section')}</legend>
                                <div className="flex w-full flex-col">
                                    <label htmlFor="favicon" className={labelClass}>
                                        {t('admin.general_favicon')}
                                    </label>
                                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.general_favicon_hint')}</p>
                                    <div className="mt-2">
                                        <FileInput value={form.data.favicon instanceof File ? form.data.favicon : null} onChange={(f) => form.setData('favicon', f)} accept="image/*" hint="Square PNG, e.g. 96×96" disabled={! canManage} />
                                    </div>
                                    {form.errors.favicon ? (
                                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{form.errors.favicon}</p>
                                    ) : null}
                                    {faviconPreviewSrc ? (
                                        <div className="mt-4">
                                            <img
                                                src={faviconPreviewSrc}
                                                alt=""
                                                className="block h-16 w-16 rounded-soft bg-neutral-50 object-contain dark:bg-neutral-800/50"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex w-full flex-col">
                                    <label htmlFor="site_logo" className={labelClass}>
                                        {t('admin.general_site_logo')}
                                    </label>
                                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.general_site_logo_hint')}</p>
                                    <div className="mt-2">
                                        <FileInput value={form.data.site_logo instanceof File ? form.data.site_logo : null} onChange={(f) => form.setData('site_logo', f)} accept="image/*" hint="PNG or WebP recommended" disabled={! canManage} />
                                    </div>
                                    {form.errors.site_logo ? (
                                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{form.errors.site_logo}</p>
                                    ) : null}
                                    {logoPreviewSrc ? (
                                        <div className="mt-4">
                                            <img
                                                src={logoPreviewSrc}
                                                alt=""
                                                className="block max-h-20 max-w-full rounded-soft bg-neutral-50 object-contain object-left dark:bg-neutral-800/50"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </fieldset>

                            {canManage && (
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" variant="primary" disabled={form.processing}>
                                        {form.processing ? '…' : t('admin.general_save')}
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
