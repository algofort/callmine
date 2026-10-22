'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { Button, Card } from '@/components/ui';
import { Head } from '@/lib/page-router';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';

export default function AdminSettingsIndex({ settingsByGroup = {}, flash = {} }) {
    const { t } = useTranslation();
    const flat = Object.entries(settingsByGroup).flatMap(([group, items]) => items.map((s) => ({ ...s, group })));
    const { data, setData, put, processing } = useForm({ settings: flat });

    return (
        <AdminLayout title={t('admin.system_settings')}>
            <Head title={`${t('admin.settings')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.system_settings')}</h2>
                <PageOverview feature="admin-settings" />
                {flash?.success && <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{flash.success}</div>}
                <form onSubmit={(e) => { e.preventDefault(); put(route('admin.settings.update')); }}>
                    <Card>
                        <Card.Body className="space-y-4">
                            {data.settings?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">No settings yet. Add keys via the form below or seed.</p>}
                            {data.settings?.map((s, i) => (
                                <div key={s.id || i} className="flex flex-wrap gap-2 items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                    <input type="hidden" name={`settings[${i}].key`} value={s.key} />
                                    <span className="font-mono text-sm w-40 text-neutral-900 dark:text-neutral-100">{s.key}</span>
                                    <input
                                        type={s.is_secret ? 'password' : 'text'}
                                        value={s.value}
                                        onChange={(e) => {
                                            const next = [...data.settings];
                                            next[i] = { ...next[i], value: e.target.value };
                                            setData('settings', next);
                                        }}
                                        placeholder={s.is_secret ? '••••••••' : 'Value'}
                                        className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <label className="flex items-center gap-1 text-sm text-neutral-900 dark:text-neutral-100"><input type="checkbox" checked={s.is_secret} onChange={(e) => { const n = [...data.settings]; n[i] = { ...n[i], is_secret: e.target.checked }; setData('settings', n); }} className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500" />Secret</label>
                                    <input type="text" value={s.group ?? ''} onChange={(e) => { const n = [...data.settings]; n[i] = { ...n[i], group: e.target.value }; setData('settings', n); }} placeholder="Group" className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                                </div>
                            ))}
                            <Button type="submit" variant="primary" disabled={processing}>Save</Button>
                        </Card.Body>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
