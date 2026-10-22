'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import { Head, router } from '@/lib/page-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Trash2, Send, User, MessageSquareText, Clock, Headphones } from 'lucide-react';
import { Button, Badge, Input, ThemedSelect, Card } from '@/components/ui';

const ASSIGN_OPTIONS = [
    { value: '', labelKey: 'assign_unassigned' },
    { value: 'agent_1', labelKey: 'assign_agent_1' },
    { value: 'agent_2', labelKey: 'assign_agent_2' },
];

function statusBadgeVariant(status) {
    switch (status) {
        case 'open':
            return 'brand';
        case 'in_progress':
            return 'warning';
        case 'resolved':
            return 'success';
        case 'closed':
            return 'default';
        default:
            return 'default';
    }
}

function priorityBadgeVariant(priority) {
    switch (priority) {
        case 'urgent':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
            return 'default';
        default:
            return 'default';
    }
}

function formatDisplayDate(iso) {
    try {
        const d = new Date(`${iso}T12:00:00`);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch {
        return iso;
    }
}

function formatMessageTime(iso) {
    if (!iso) {
        return '';
    }
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) {
            return '';
        }
        return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
}

export default function SupportTickets({ tickets = [] }) {
    const { t } = useTranslation();
    const ui = (key, opt) => t(`client.support_tickets_ui.${key}`, opt);

    const [selectedId, setSelectedId] = useState(tickets[0]?.id ?? null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [reply, setReply] = useState('');
    const [internalNote, setInternalNote] = useState(false);

    const statusOptions = useMemo(
        () => [
            { value: '', label: ui('filter_all_status') },
            { value: 'open', label: ui('status_open') },
            { value: 'in_progress', label: ui('status_in_progress') },
            { value: 'resolved', label: ui('status_resolved') },
            { value: 'closed', label: ui('status_closed') },
        ],
        [t],
    );

    const priorityOptions = useMemo(
        () => [
            { value: '', label: ui('filter_all_priority') },
            { value: 'urgent', label: ui('priority_urgent') },
            { value: 'medium', label: ui('priority_medium') },
            { value: 'low', label: ui('priority_low') },
        ],
        [t],
    );

    const detailStatusOptions = useMemo(
        () => [
            { value: 'open', label: ui('status_open') },
            { value: 'in_progress', label: ui('status_in_progress') },
            { value: 'resolved', label: ui('status_resolved') },
            { value: 'closed', label: ui('status_closed') },
        ],
        [t],
    );

    const detailPriorityOptions = useMemo(
        () => [
            { value: 'urgent', label: ui('priority_urgent') },
            { value: 'medium', label: ui('priority_medium') },
            { value: 'low', label: ui('priority_low') },
        ],
        [t],
    );

    const assignSelectOptions = useMemo(
        () =>
            ASSIGN_OPTIONS.map((o) => ({
                value: o.value,
                label: ui(o.labelKey),
            })),
        [t],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tickets.filter((row) => {
            if (statusFilter && row.status !== statusFilter) {
                return false;
            }
            if (priorityFilter && row.priority !== priorityFilter) {
                return false;
            }
            if (!q) {
                return true;
            }
            const hay = [row.title, row.creatorName, row.description].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [tickets, query, statusFilter, priorityFilter]);

    useEffect(() => {
        if (!selectedId || filtered.some((x) => x.id === selectedId)) {
            return;
        }
        setSelectedId(filtered[0]?.id ?? null);
    }, [filtered, selectedId]);

    useEffect(() => {
        if (selectedId && tickets.some((x) => x.id === selectedId)) {
            return;
        }
        if (!selectedId) {
            return;
        }
        setSelectedId(filtered[0]?.id ?? null);
    }, [tickets, selectedId, filtered]);

    const selected = useMemo(() => tickets.find((x) => String(x.id) === String(selectedId)) ?? null, [tickets, selectedId]);

    const stats = useMemo(() => {
        let open = 0;
        let inProgress = 0;
        let resolved = 0;
        let urgent = 0;
        for (const row of tickets) {
            if (row.status === 'open') {
                open += 1;
            }
            if (row.status === 'in_progress') {
                inProgress += 1;
            }
            if (row.status === 'resolved') {
                resolved += 1;
            }
            if (row.priority === 'urgent') {
                urgent += 1;
            }
        }
        return { open, inProgress, resolved, urgent };
    }, [tickets]);

    const updateTicket = useCallback((id, patch) => {
        router.patch(route('client.support-system.support.update', id), patch, {
            preserveScroll: true,
        });
    }, []);

    const handleSendReply = () => {
        const text = reply.trim();
        if (!selected || !text) {
            return;
        }
        router.post(route('client.support-system.support.reply', selected.id), {
            message: text,
            internal_note: internalNote,
        }, {
            preserveScroll: true,
        });
        setReply('');
        setInternalNote(false);
    };

    const handleResolve = () => {
        if (!selected) {
            return;
        }
        updateTicket(selected.id, { status: 'resolved' });
    };

    const statCardClass = (tone) =>
        [
            'rounded-xl border p-4 shadow-soft sm:p-5',
            tone === 'sky' && 'border-sky-200/80 bg-sky-50/90 dark:border-sky-800/50 dark:bg-sky-950/30',
            tone === 'amber' && 'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-950/30',
            tone === 'emerald' && 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/50 dark:bg-emerald-950/30',
            tone === 'red' && 'border-red-200/80 bg-red-50/90 dark:border-red-800/50 dark:bg-red-950/30',
        ]
            .filter(Boolean)
            .join(' ');

    return (
        <ClientLayout title={ui('title')}>
            <Head title={ui('title')} />
            <div className="w-full space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-3xl">
                        {ui('title')}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ui('subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <div className={statCardClass('sky')}>
                        <p className="text-sm font-medium text-sky-800 dark:text-sky-200">{ui('stat_open')}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-sky-900 dark:text-sky-100">{stats.open}</p>
                    </div>
                    <div className={statCardClass('amber')}>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{ui('stat_in_progress')}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
                            {stats.inProgress}
                        </p>
                    </div>
                    <div className={statCardClass('emerald')}>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{ui('stat_resolved')}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                            {stats.resolved}
                        </p>
                    </div>
                    <div className={statCardClass('red')}>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">{ui('stat_urgent')}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-red-900 dark:text-red-100">{stats.urgent}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
                    <div className="w-full shrink-0 lg:max-w-md lg:basis-[min(100%,380px)]">
                        <Card padding className="flex h-full min-h-[420px] flex-col p-4 sm:p-5">
                            <div className="flex flex-col gap-3">
                                <div className="relative min-w-0">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={ui('search_placeholder')}
                                        className="pl-10"
                                        aria-label={ui('search_placeholder')}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <ThemedSelect
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        placeholder={ui('filter_all_status')}
                                        options={statusOptions}
                                    />
                                    <ThemedSelect
                                        value={priorityFilter}
                                        onChange={setPriorityFilter}
                                        placeholder={ui('filter_all_priority')}
                                        options={priorityOptions}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-0.5">
                                {filtered.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                        {ui('no_tickets')}
                                    </p>
                                ) : (
                                    filtered.map((row) => {
                                        const isActive = row.id === selectedId;
                                        return (
                                            <button
                                                key={row.id}
                                                type="button"
                                                onClick={() => setSelectedId(row.id)}
                                                className={[
                                                    'w-full rounded-soft border p-3 text-left transition duration-150',
                                                    isActive
                                                        ? 'border-emerald-400 bg-emerald-50/80 shadow-soft dark:border-emerald-600 dark:bg-emerald-950/40'
                                                        : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/80 dark:hover:bg-neutral-800/80',
                                                ].join(' ')}
                                            >
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{row.title}</p>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <Badge variant={statusBadgeVariant(row.status)} size="sm">
                                                        {ui(`status_${row.status}`)}
                                                    </Badge>
                                                    <Badge
                                                        variant={priorityBadgeVariant(row.priority)}
                                                        size="sm"
                                                    >
                                                        {ui(`priority_${row.priority}`)}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {row.creatorName} · {formatDisplayDate(row.createdAt)}
                                                </p>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="min-w-0 flex-1">
                        {!selected ? (
                            <Card className="flex min-h-[420px] flex-col items-center justify-center gap-3 border-dashed border-neutral-300 bg-gradient-to-b from-neutral-50/80 to-white p-10 text-center dark:border-neutral-600 dark:from-neutral-900/40 dark:to-neutral-900/80">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                    <MessageSquareText className="h-7 w-7" strokeWidth={1.75} />
                                </div>
                                <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{ui('empty_select_ticket')}</p>
                            </Card>
                        ) : (
                            <Card
                                padding={false}
                                className="overflow-hidden border border-neutral-200/90 shadow-soft-md ring-1 ring-black/[0.02] dark:border-neutral-700/90 dark:ring-white/[0.04]"
                            >
                                {/* Ticket header */}
                                <div className="relative border-b border-neutral-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/50 px-4 py-5 dark:border-neutral-800 dark:from-emerald-950/35 dark:via-neutral-900 dark:to-sky-950/20 sm:px-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 space-y-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/90">
                                                #{selected.id}
                                            </p>
                                            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                                                {selected.title}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={statusBadgeVariant(selected.status)} size="md" className="capitalize">
                                                    {ui(`status_${selected.status}`)}
                                                </Badge>
                                                <Badge variant={priorityBadgeVariant(selected.priority)} size="md">
                                                    {ui(`priority_${selected.priority}`)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button type="button" variant="outline" size="md" className="gap-2 bg-white/80 dark:bg-neutral-900/80">
                                                <RefreshCw className="h-4 w-4 shrink-0" strokeWidth={2} />
                                                {ui('refresh')}
                                            </Button>
                                            <button
                                                type="button"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200/90 bg-white/80 text-red-400 transition hover:border-red-300 hover:text-red-500 disabled:opacity-40 dark:border-red-900/50 dark:bg-neutral-900/80 dark:text-red-500/80"
                                                aria-label={ui('delete_ticket')}
                                                disabled
                                            >
                                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta strip */}
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-950/50">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                                                <User className="h-5 w-5" strokeWidth={2} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                    {ui('label_creator')}
                                                </p>
                                                <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {selected.creatorName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-950/50">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-200/90 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                                                <Clock className="h-5 w-5" strokeWidth={2} />
                                            </span>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                    {ui('label_details')}
                                                </p>
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {formatDisplayDate(selected.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6">
                                    {/* Controls */}
                                    <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-4 dark:border-neutral-700/80 dark:bg-neutral-950/40">
                                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                            <Headphones className="h-3.5 w-3.5" strokeWidth={2} />
                                            <span>{ui('section_triage')}</span>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="mb-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                    {ui('label_status')}
                                                </p>
                                                <ThemedSelect
                                                    value={selected.status}
                                                    onChange={(v) => updateTicket(selected.id, { status: v })}
                                                    options={detailStatusOptions}
                                                />
                                            </div>
                                            <div>
                                                <p className="mb-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                    {ui('label_priority')}
                                                </p>
                                                <ThemedSelect
                                                    value={selected.priority}
                                                    onChange={(v) => updateTicket(selected.id, { priority: v })}
                                                    options={detailPriorityOptions}
                                                />
                                            </div>
                                            <div>
                                                <p className="mb-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                    {ui('label_assign_to')}
                                                </p>
                                                <ThemedSelect
                                                    value={selected.assignee ?? ''}
                                                    onChange={(v) => updateTicket(selected.id, { assignee: v || null })}
                                                    options={assignSelectOptions}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                            {ui('label_description')}
                                        </p>
                                        <div className="rounded-2xl border-l-4 border-l-emerald-500 bg-neutral-50/90 px-4 py-3.5 text-sm leading-relaxed text-neutral-800 shadow-inner dark:border-l-emerald-400 dark:bg-neutral-900/60 dark:text-neutral-200">
                                            {selected.description}
                                        </div>
                                    </div>

                                    {/* Conversation — chat layout */}
                                    <div>
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                {ui('label_conversation')}
                                            </p>
                                            <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                {selected.messages.length}
                                            </span>
                                        </div>
                                        <div className="max-h-[min(52vh,420px)] space-y-3 overflow-y-auto rounded-2xl border border-neutral-200/80 bg-gradient-to-b from-neutral-50/50 to-white px-3 py-4 dark:border-neutral-700/80 dark:from-neutral-950/40 dark:to-neutral-900/30 sm:px-4">
                                            {selected.messages.length === 0 ? (
                                                <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                                    {ui('conversation_empty')}
                                                </p>
                                            ) : (
                                                selected.messages.map((m, i) => {
                                                    const time = formatMessageTime(m.at);
                                                    if (m.role === 'internal') {
                                                        return (
                                                            <div key={`${m.at}-${i}`} className="flex justify-center">
                                                                <div className="max-w-[95%] rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-center text-sm shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                                                                        {ui('role_internal')}
                                                                    </p>
                                                                    <p className="mt-1 text-neutral-800 dark:text-amber-50/95">{m.text}</p>
                                                                    {time ? (
                                                                        <p className="mt-1 text-[10px] text-amber-700/70 dark:text-amber-300/70">
                                                                            {time}
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    const isUser = m.role === 'user';
                                                    return (
                                                        <div
                                                            key={`${m.at}-${i}`}
                                                            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={[
                                                                    'max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%]',
                                                                    isUser
                                                                        ? 'rounded-tr-md bg-neutral-200/95 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                                                                        : 'rounded-tl-md bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
                                                                ].join(' ')}
                                                            >
                                                                <p
                                                                    className={[
                                                                        'text-[10px] font-semibold uppercase tracking-wide',
                                                                        isUser
                                                                            ? 'text-neutral-600 dark:text-neutral-400'
                                                                            : 'text-emerald-100/90',
                                                                    ].join(' ')}
                                                                >
                                                                    {isUser ? ui('role_user') : ui('role_agent')}
                                                                </p>
                                                                <p
                                                                    className={[
                                                                        'mt-1 whitespace-pre-wrap leading-relaxed',
                                                                        isUser ? '' : 'text-white',
                                                                    ].join(' ')}
                                                                >
                                                                    {m.text}
                                                                </p>
                                                                {time ? (
                                                                    <p
                                                                        className={[
                                                                            'mt-1.5 text-[10px] tabular-nums',
                                                                            isUser
                                                                                ? 'text-neutral-500 dark:text-neutral-500'
                                                                                : 'text-emerald-100/75',
                                                                        ].join(' ')}
                                                                    >
                                                                        {time}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Composer */}
                                    <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/60">
                                        <label className="sr-only" htmlFor="support-reply">
                                            {ui('reply_placeholder')}
                                        </label>
                                        <textarea
                                            id="support-reply"
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            rows={3}
                                            placeholder={ui('reply_placeholder')}
                                            className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500"
                                        />
                                        <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                                            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm text-neutral-600 transition hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900/50">
                                                <input
                                                    type="checkbox"
                                                    checked={internalNote}
                                                    onChange={(e) => setInternalNote(e.target.checked)}
                                                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800"
                                                />
                                                {ui('internal_note')}
                                            </label>
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Button type="button" variant="outline" size="md" onClick={handleResolve} className="order-2 sm:order-1">
                                                    {ui('resolve_ticket')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="md"
                                                    className="order-1 gap-2 shadow-md shadow-emerald-500/15 sm:order-2"
                                                    onClick={handleSendReply}
                                                    disabled={!reply.trim()}
                                                >
                                                    <Send className="h-4 w-4 shrink-0" strokeWidth={2} />
                                                    {ui('send_reply')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
