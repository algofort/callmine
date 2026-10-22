'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { useTranslation } from 'react-i18next';
import { KanbanSquare, Building2, Phone, GripVertical } from 'lucide-react';

// Distinct accent per stage. Each entry drives the column header + card ring.
const STAGE_STYLES = {
    new: {
        header: 'bg-neutral-100 text-neutral-700 dark:bg-ink-800 dark:text-neutral-200',
        dot: 'bg-neutral-400',
        count: 'bg-white/70 text-neutral-600 dark:bg-ink-900/60 dark:text-neutral-300',
        drop: 'border-neutral-300 dark:border-ink-600',
    },
    contacted: {
        header: 'bg-cold/15 text-cold dark:text-sky-300',
        dot: 'bg-cold',
        count: 'bg-white/70 text-cold dark:bg-ink-900/60 dark:text-sky-300',
        drop: 'border-cold/50',
    },
    qualified: {
        header: 'bg-warm/20 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
        count: 'bg-white/70 text-amber-700 dark:bg-ink-900/60 dark:text-amber-300',
        drop: 'border-amber-400/60',
    },
    won: {
        header: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300',
        dot: 'bg-signal-500',
        count: 'bg-white/70 text-signal-700 dark:bg-ink-900/60 dark:text-signal-300',
        drop: 'border-signal-400/60',
    },
    lost: {
        header: 'bg-danger/15 text-danger',
        dot: 'bg-danger',
        count: 'bg-white/70 text-danger dark:bg-ink-900/60',
        drop: 'border-danger/50',
    },
};

const OVERVIEW = {
    icon: KanbanSquare,
    accent: 'brand',
    title: 'Quick CRM',
    description: 'A simple sales pipeline over your contacts — drag a lead through each stage.',
    steps: ['Drag a card to a stage', 'Qualify your leads', 'Close won or lost'],
};

function ContactCard({ contact, stages, onMove, onDragStart, onDragEnd }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, contact.id)}
            onDragEnd={onDragEnd}
            className="group cursor-grab rounded-soft border border-neutral-200 bg-white p-3 shadow-soft transition hover:shadow-soft-lg active:cursor-grabbing dark:border-ink-800 dark:bg-ink-900"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{contact.name || 'Unnamed lead'}</p>
                    {contact.company && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            <Building2 className="h-3 w-3 shrink-0" /> {contact.company}
                        </p>
                    )}
                </div>
                <GripVertical className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition group-hover:opacity-100 dark:text-ink-600" />
            </div>
            {contact.phone && (
                <p className="mt-2 flex items-center gap-1 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                    <Phone className="h-3 w-3 shrink-0" /> {contact.phone}
                </p>
            )}
            {/* Accessible fallback: move the lead without drag-and-drop. */}
            <label className="mt-3 block">
                <span className="sr-only">Move lead to stage</span>
                <select
                    value={contact.pipeline_stage}
                    onChange={(e) => onMove(contact.id, e.target.value)}
                    className="w-full rounded-soft border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 focus:border-brand-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-300"
                >
                    {stages.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
            </label>
        </div>
    );
}

export default function CrmBoard({ columns = [], stats = [], stages = [] }) {
    const { t } = useTranslation();
    const [dragOver, setDragOver] = useState(null);

    const move = (id, stage) => {
        router.put(route('client.crm.update-stage', id), { stage }, { preserveScroll: true, preserveState: true });
    };

    const onDragStart = (e, id) => {
        e.dataTransfer.setData('text/plain', String(id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = (e, stageKey) => {
        e.preventDefault();
        setDragOver(null);
        const id = e.dataTransfer.getData('text/plain');
        const col = columns.find((c) => c.key === stageKey);
        // No-op if dropped on the column it already lives in.
        if (id && !(col && col.contacts.some((c) => String(c.id) === String(id)))) {
            move(id, stageKey);
        }
    };

    return (
        <ClientLayout title={t('nav.crm') !== 'nav.crm' ? t('nav.crm') : 'Quick CRM'}>
            <Head title="Quick CRM" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Quick CRM</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Drag leads across your pipeline stages.</p>
                    </div>
                </div>

                <PageOverview feature="quick-crm" {...OVERVIEW} />
                <StatCards items={stats} />

                <div className="-mx-1 overflow-x-auto pb-2">
                    <div className="flex min-w-max gap-4 px-1">
                        {columns.map((col) => {
                            const s = STAGE_STYLES[col.key] || STAGE_STYLES.new;
                            const active = dragOver === col.key;
                            return (
                                <div
                                    key={col.key}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(col.key); }}
                                    onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(null); }}
                                    onDrop={(e) => onDrop(e, col.key)}
                                    className={`flex w-72 shrink-0 flex-col rounded-soft-lg border bg-neutral-50/60 transition dark:bg-ink-950/40 ${active ? `border-2 border-dashed ${s.drop} bg-white dark:bg-ink-900/60` : 'border-neutral-200 dark:border-ink-800'}`}
                                >
                                    <div className={`flex items-center justify-between rounded-t-soft-lg px-3 py-2.5 ${s.header}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                                            <span className="text-sm font-semibold">{col.label}</span>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${s.count}`}>{col.contacts.length}</span>
                                    </div>
                                    <div className="flex min-h-[8rem] flex-1 flex-col gap-2 p-2.5">
                                        {col.contacts.length > 0 ? (
                                            col.contacts.map((c) => (
                                                <ContactCard
                                                    key={c.id}
                                                    contact={c}
                                                    stages={stages}
                                                    onMove={move}
                                                    onDragStart={onDragStart}
                                                    onDragEnd={() => setDragOver(null)}
                                                />
                                            ))
                                        ) : (
                                            <div className="flex flex-1 items-center justify-center rounded-soft border border-dashed border-neutral-200 py-6 text-center text-xs text-neutral-400 dark:border-ink-800">
                                                Drop leads here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
