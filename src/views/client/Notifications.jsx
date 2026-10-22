'use client';

import { Head } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { Bell, Info, CheckCircle2, AlertTriangle, AlertOctagon, Megaphone } from 'lucide-react';

const LEVEL = {
    info: { icon: Info, cls: 'text-brand-500' },
    success: { icon: CheckCircle2, cls: 'text-signal-500' },
    warning: { icon: AlertTriangle, cls: 'text-amber-500' },
    critical: { icon: AlertOctagon, cls: 'text-danger' },
};

export default function Notifications({ notifications = [] }) {
    return (
        <ClientLayout title="Notifications">
            <Head title="Notifications" />
            <div className="mx-auto max-w-2xl space-y-4">
                <div className="flex items-center gap-2"><Bell className="h-6 w-6 text-brand-600 dark:text-brand-400" /><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h1></div>
                <div className="space-y-2">
                    {notifications.map((n) => {
                        const L = LEVEL[n.level] || LEVEL.info;
                        const Icon = L.icon;
                        return (
                            <div key={n.id} className="flex gap-3 rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <span className={`mt-0.5 shrink-0 ${L.cls}`}><Icon className="h-5 w-5" /></span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2"><p className="font-display font-semibold text-neutral-900 dark:text-white">{n.title}</p>{n.broadcast && <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-700 dark:text-brand-300"><Megaphone className="h-3 w-3" /> Announcement</span>}</div>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{n.message}</p>
                                    <p className="mt-1 text-xs text-neutral-400">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        );
                    })}
                    {notifications.length === 0 && <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center"><Bell className="mx-auto mb-2 h-10 w-10 text-neutral-300" /><p className="text-sm text-neutral-500">No notifications.</p></div>}
                </div>
            </div>
        </ClientLayout>
    );
}
