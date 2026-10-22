'use client';

import { route } from '@/lib/route';
import { Head, router, useForm } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import SetupGuide from '@/components/SetupGuide';
import { MessageSquare, Copy } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function Stat({ label, value }) {
    return <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft"><p className="text-xs font-medium uppercase text-neutral-500">{label}</p><p className="mt-1 font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p></div>;
}

export default function MessagingIndex({ settings = {}, logs = [], stats = {}, filters = {} }) {
    const form = useForm({
        provider_mode: settings.provider_mode || 'disabled',
        meta_app_id: settings.meta_app_id || '', meta_app_secret: '', meta_config_id: settings.meta_config_id || '',
        verify_token: settings.verify_token || '', embedded_signup_enabled: settings.embedded_signup_enabled || false, coexistence_enabled: settings.coexistence_enabled || false,
    });
    const save = (e) => { e.preventDefault(); form.put(route('admin.messaging.update'), { preserveScroll: true }); };

    return (
        <AdminLayout title="Messaging">
            <Head title="Messaging" />
            <div className="space-y-6">
                <div className="flex items-center gap-2"><MessageSquare className="h-6 w-6 text-brand-600 dark:text-brand-400" /><h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">Messaging</h2></div>

                <PageOverview feature="admin-messaging" />

                <div className="grid gap-3 sm:grid-cols-2">
                    <SetupGuide guide="whatsapp-meta" />
                    <SetupGuide guide="whatsway" />
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                    <Stat label="Total messages" value={stats.total ?? 0} />
                    <Stat label="Emails" value={stats.emails ?? 0} />
                    <Stat label="WhatsApp" value={stats.whatsapp ?? 0} />
                    <Stat label="Success rate" value={`${stats.success_rate ?? 0}%`} />
                </div>

                <form onSubmit={save} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft space-y-4">
                    <h3 className="font-display font-semibold text-neutral-900 dark:text-white">WhatsApp provider</h3>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Provider mode</label>
                        <select className={inputCls} value={form.data.provider_mode} onChange={(e) => form.setData('provider_mode', e.target.value)}>
                            <option value="disabled">Disabled</option><option value="meta">Meta only</option><option value="whatsway">WhatsWay only</option><option value="both">Both</option>
                        </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div><label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Meta App ID</label><input className={inputCls} value={form.data.meta_app_id} onChange={(e) => form.setData('meta_app_id', e.target.value)} /></div>
                        <div><label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Meta Config ID</label><input className={inputCls} value={form.data.meta_config_id} onChange={(e) => form.setData('meta_config_id', e.target.value)} /></div>
                        <div><label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Meta App Secret</label><input type="password" className={inputCls} placeholder="•••• (unchanged)" value={form.data.meta_app_secret} onChange={(e) => form.setData('meta_app_secret', e.target.value)} /></div>
                        <div><label className="mb-1 block text-xs font-medium uppercase text-neutral-500">Verify token</label><input className={inputCls} value={form.data.verify_token} onChange={(e) => form.setData('verify_token', e.target.value)} /></div>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" checked={form.data.embedded_signup_enabled} onChange={(e) => form.setData('embedded_signup_enabled', e.target.checked)} /> Embedded Signup</label>
                        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" checked={form.data.coexistence_enabled} onChange={(e) => form.setData('coexistence_enabled', e.target.checked)} /> Coexistence mode</label>
                    </div>
                    <div className="flex items-center gap-2 rounded-soft bg-neutral-50 dark:bg-ink-800/50 px-3 py-2 text-xs text-neutral-500">
                        <span>Webhook URL:</span><code className="font-mono">{settings.webhook_url}</code>
                        <button type="button" onClick={() => navigator.clipboard?.writeText(settings.webhook_url)}><Copy className="h-3.5 w-3.5" /></button>
                    </div>
                    <button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Save settings</button>
                </form>

                <div>
                    <div className="mb-2 flex items-center gap-2"><h3 className="font-display font-semibold text-neutral-900 dark:text-white">Recent messages</h3>
                        <div className="ml-auto flex gap-1">{['', 'email', 'whatsapp'].map((c) => <button key={c || 'all'} onClick={() => router.get(route('admin.messaging.index'), c ? { channel: c } : {}, { preserveState: true, replace: true })} className={`rounded-soft px-2.5 py-1 text-xs capitalize ${(filters.channel || '') === c ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{c || 'All'}</button>)}</div>
                    </div>
                    <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                        <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm"><tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {logs.map((l) => (
                                <tr key={l.id}><td className="px-4 py-2.5 text-neutral-900 dark:text-white">{l.customer || '—'}</td><td className="px-4 py-2.5 capitalize text-neutral-500">{l.channel} · {l.direction}</td><td className="px-4 py-2.5"><span className="rounded-full bg-neutral-100 dark:bg-ink-800 px-2 py-0.5 text-[11px] capitalize">{l.status}</span></td><td className="px-4 py-2.5 text-neutral-400">{new Date(l.created_at).toLocaleString()}</td></tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-neutral-500">No messages yet.</td></tr>}
                        </tbody></table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
