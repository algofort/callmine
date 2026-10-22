'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import KycGate from '@/components/KycGate';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Users, PhoneCall } from 'lucide-react';

const STATUS = {
    active: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    paused: 'bg-warm/20 text-amber-700 dark:text-amber-300',
    completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
    draft: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300',
};
const TYPE_LABEL = { lead_qualification: 'Lead Qualification', sales: 'Sales', support: 'Support', survey: 'Survey' };

export default function CampaignsIndex({ campaigns, filters = {}, stats = [] }) {
    const { t } = useTranslation();
    const filter = (status) => router.get(route('client.campaigns.index'), status ? { status } : {}, { preserveState: true, replace: true });

    return (
        <ClientLayout title={t('nav.campaigns') !== 'nav.campaigns' ? t('nav.campaigns') : 'Campaigns'}>
            <Head title="Campaigns" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Campaigns</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Outbound AI calling campaigns.</p>
                    </div>
                    <Link href={route('client.campaigns.create')} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New campaign</Link>
                </div>

                <PageOverview feature="campaigns" />
                <KycGate action="launch campaigns" />
                <StatCards items={stats} />

                <div className="flex gap-1.5">
                    {['', 'active', 'paused', 'completed', 'draft'].map((s) => (
                        <button key={s || 'all'} onClick={() => filter(s)} className={`rounded-soft px-3 py-1.5 text-xs font-medium capitalize ${(filters.status || '') === s ? 'bg-brand-600 text-white' : 'border border-neutral-200 dark:border-ink-700 text-neutral-600 dark:text-neutral-300'}`}>{s || 'All'}</button>
                    ))}
                </div>

                {campaigns.data.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {campaigns.data.map((c) => (
                            <Link key={c.id} href={route('client.campaigns.show', c.id)} className="block rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft hover:border-brand-300 dark:hover:border-ink-700 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><Megaphone className="h-4 w-4" /></span>
                                        <div className="min-w-0"><p className="truncate font-display font-semibold text-neutral-900 dark:text-white">{c.name}</p><p className="text-xs text-neutral-500">{TYPE_LABEL[c.type] || c.type}</p></div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[c.status] || STATUS.draft}`}>{c.status}</span>
                                </div>
                                <div className="mt-3 flex gap-4 text-xs text-neutral-500">
                                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.contacts_count} contacts</span>
                                    <span className="inline-flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" /> {c.calls_count} calls</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-soft-lg border border-dashed border-neutral-300 dark:border-ink-700 px-6 py-16 text-center"><Megaphone className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No campaigns yet.</p><Link href={route('client.campaigns.create')} className="mt-3 inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> Create your first campaign</Link></div>
                )}
            </div>
        </ClientLayout>
    );
}
