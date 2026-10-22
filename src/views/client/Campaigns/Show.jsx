'use client';

import { route } from '@/lib/route';
import { Head, Link, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import KycGate from '@/components/KycGate';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, Trash2, Users, PhoneCall, Bot, Hash, Megaphone, Pencil } from 'lucide-react';

const STATUS = {
    active: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
    paused: 'bg-warm/20 text-amber-700 dark:text-amber-300',
    completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
    draft: 'bg-neutral-100 text-neutral-600 dark:bg-ink-800 dark:text-neutral-300',
};
const TYPE_LABEL = { lead_qualification: 'Lead Qualification', sales: 'Sales', support: 'Support', survey: 'Survey' };

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-neutral-500"><Icon className="h-4 w-4" /><span className="text-xs font-medium uppercase">{label}</span></div>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
        </div>
    );
}

export default function CampaignShow({ campaign }) {
    const { t } = useTranslation();
    const act = (verb) => router.post(route(`client.campaigns.${verb}`, campaign.id), {}, { preserveScroll: true });
    const remove = () => { if (confirm('Delete this campaign?')) router.delete(route('client.campaigns.destroy', campaign.id)); };

    return (
        <ClientLayout title={campaign.name}>
            <Head title={campaign.name} />
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('client.campaigns.index')} className="rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /></Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-white">{campaign.name}</h1>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS[campaign.status]}`}>{campaign.status}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-neutral-500">{TYPE_LABEL[campaign.type] || campaign.type}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['draft', 'paused'].includes(campaign.status) && <Link href={route('client.campaigns.edit', campaign.id)} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /> Edit</Link>}
                        {['draft', 'paused'].includes(campaign.status) && <button onClick={() => act(campaign.status === 'draft' ? 'launch' : 'resume')} className="inline-flex items-center gap-2 rounded-soft bg-signal-500 px-3 py-2 text-sm font-medium text-white hover:bg-signal-600"><Play className="h-4 w-4" /> {campaign.status === 'draft' ? 'Launch' : 'Resume'}</button>}
                        {campaign.status === 'active' && <button onClick={() => act('pause')} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Pause className="h-4 w-4" /> Pause</button>}
                        <button onClick={remove} className="inline-flex items-center gap-2 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-2 text-sm text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                </div>

                {['draft', 'paused'].includes(campaign.status) && <KycGate action="launch this campaign" />}

                {campaign.goal && <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 text-sm text-neutral-600 dark:text-neutral-300"><span className="font-medium text-neutral-900 dark:text-white">Goal: </span>{campaign.goal}</div>}

                <div className="grid gap-3 sm:grid-cols-4">
                    <Metric icon={Users} label="Contacts" value={campaign.contacts_count} />
                    <Metric icon={PhoneCall} label="Calls" value={campaign.calls_count} />
                    <Metric icon={Bot} label="Agent" value={campaign.agent?.name || '—'} />
                    <Metric icon={Hash} label="Caller ID" value={campaign.number || '—'} />
                </div>

                {(!campaign.agent || !campaign.number) && (
                    <div className="rounded-soft-lg border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Assign an agent and a phone number before launching. Edit the campaign to set them.
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
