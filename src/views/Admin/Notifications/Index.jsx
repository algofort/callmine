'use client';

import { route } from '@/lib/route';
import { Head, router, useForm } from '@/lib/page-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Bell, Send, Trash2 } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';
const LEVEL = { info: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300', success: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300', warning: 'bg-warm/20 text-amber-700 dark:text-amber-300', critical: 'bg-danger/10 text-danger' };

export default function NotificationsIndex({ notifications = [], stats = [] }) {
    const form = useForm({ title: '', message: '', level: 'info' });
    const send = (e) => { e.preventDefault(); form.post(route('admin.notifications.store'), { preserveScroll: true, onSuccess: () => form.reset() }); };
    const remove = (n) => { if (confirm('Delete?')) router.delete(route('admin.notifications.destroy', n.id), { preserveScroll: true }); };

    return (
        <AdminLayout title="Notifications">
            <Head title="Notifications" />
            <div className="space-y-6">
                <PageOverview feature="admin-notifications" />
                <StatCards items={stats} />
                <div className="grid gap-6 lg:grid-cols-3">
                <form onSubmit={send} className="space-y-3 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
                    <h3 className="flex items-center gap-2 font-display font-semibold text-neutral-900 dark:text-white"><Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" /> Broadcast</h3>
                    <input className={inputCls} placeholder="Title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                    {form.errors.title && <p className="text-xs text-danger">{form.errors.title}</p>}
                    <textarea rows="4" className={inputCls} placeholder="Message to all customers…" value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} />
                    <select className={inputCls} value={form.data.level} onChange={(e) => form.setData('level', e.target.value)}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
                    <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Send className="h-4 w-4" /> Send to all customers</button>
                </form>

                <div className="lg:col-span-2">
                    <h3 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Sent</h3>
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div key={n.id} className="flex items-start justify-between gap-3 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL[n.level]}`}>{n.level}</span><p className="font-display font-semibold text-neutral-900 dark:text-white">{n.title}</p></div><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{n.message}</p><p className="mt-1 text-xs text-neutral-400">{n.audience} · {new Date(n.created_at).toLocaleString()}</p></div>
                                <button onClick={() => remove(n)} className="shrink-0 rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}
                        {notifications.length === 0 && <p className="py-12 text-center text-sm text-neutral-400">No notifications sent.</p>}
                    </div>
                </div>
                </div>
            </div>
        </AdminLayout>
    );
}
