'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Pagination } from '@/components/ui';
import { CalendarClock, Search, Plus, Trash2, X, Check, Ban, Clock } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

const STATUS_META = {
    scheduled: { label: 'Scheduled', cls: 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300' },
    completed: { label: 'Completed', cls: 'bg-cold-100 text-cold-700 dark:bg-cold-500/20 dark:text-cold-300' },
    cancelled: { label: 'Cancelled', cls: 'bg-warm-100 text-warm-700 dark:bg-warm-500/20 dark:text-warm-300' },
    no_show: { label: 'No show', cls: 'bg-danger/10 text-danger' },
};

function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function AddModal({ agents = [], contacts = [], onClose }) {
    const form = useForm({
        title: '',
        contact_id: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        scheduled_at: '',
        duration_minutes: 30,
        agent_id: '',
        notes: '',
    });

    const pickContact = (id) => {
        form.setData('contact_id', id);
        const c = contacts.find((x) => String(x.id) === String(id));
        if (c) {
            form.setData('contact_name', c.name || '');
            form.setData('contact_phone', c.phone || '');
        }
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('client.appointments.store'), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-lg rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">New appointment</h3>
                    <button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button>
                </div>

                <input className={inputCls} placeholder="Title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                {form.errors.title && <p className="text-xs text-danger">{form.errors.title}</p>}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Date &amp; time</label>
                        <input type="datetime-local" className={inputCls} value={form.data.scheduled_at} onChange={(e) => form.setData('scheduled_at', e.target.value)} />
                        {form.errors.scheduled_at && <p className="text-xs text-danger">{form.errors.scheduled_at}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Duration (min)</label>
                        <input type="number" min="5" max="1440" className={inputCls} value={form.data.duration_minutes} onChange={(e) => form.setData('duration_minutes', e.target.value)} />
                    </div>
                </div>

                {contacts.length > 0 && (
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Link contact (optional)</label>
                        <select className={`${inputCls} pr-8`} value={form.data.contact_id} onChange={(e) => pickContact(e.target.value)}>
                            <option value="">— None —</option>
                            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name || c.phone}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Contact name" value={form.data.contact_name} onChange={(e) => form.setData('contact_name', e.target.value)} />
                    <input className={inputCls} placeholder="Contact phone" value={form.data.contact_phone} onChange={(e) => form.setData('contact_phone', e.target.value)} />
                </div>
                <input className={inputCls} placeholder="Contact email" value={form.data.contact_email} onChange={(e) => form.setData('contact_email', e.target.value)} />

                <div>
                    <label className="mb-1 block text-xs text-neutral-500">Assign agent (optional)</label>
                    <select className={`${inputCls} pr-8`} value={form.data.agent_id} onChange={(e) => form.setData('agent_id', e.target.value)}>
                        <option value="">— None —</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                <textarea className={inputCls} rows="2" placeholder="Notes" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button>
                    <button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Create</button>
                </div>
            </form>
        </div>
    );
}

export default function AppointmentsIndex({ appointments, filters = {}, stats = [], agents = [], contacts = [] }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showModal, setShowModal] = useState(false);

    const apply = (e) => {
        e?.preventDefault();
        router.get(route('client.appointments.index'), { search, status }, { preserveState: true, replace: true });
    };
    const filterStatus = (val) => {
        setStatus(val);
        router.get(route('client.appointments.index'), { search, status: val }, { preserveState: true, replace: true });
    };
    const setRowStatus = (a, s) => router.put(route('client.appointments.update', a.id), { title: a.title, scheduled_at: a.scheduled_at, duration_minutes: a.duration_minutes, status: s }, { preserveScroll: true });
    const remove = (a) => { if (confirm('Delete this appointment?')) router.delete(route('client.appointments.destroy', a.id), { preserveScroll: true }); };

    return (
        <ClientLayout title={t('nav.appointments') !== 'nav.appointments' ? t('nav.appointments') : 'Appointments'}>
            <Head title="Appointments" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Appointments</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage bookings and scheduled meetings</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"><Plus className="h-4 w-4" /> New appointment</button>
                </div>

                <PageOverview feature="appointments" />

                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={apply} className="relative max-w-md flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or contact…" className="w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm" />
                    </form>
                    <select value={status} onChange={(e) => filterStatus(e.target.value)} className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 pr-8 py-2 text-sm">
                        <option value="">All statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No show</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    {appointments.data.length > 0 ? (
                        <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                            <thead className="bg-neutral-50 dark:bg-ink-800/50">
                                <tr>{['Title', 'Contact', 'Agent', 'When', 'Duration', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                                {appointments.data.map((a) => {
                                    const meta = STATUS_META[a.status] ?? STATUS_META.scheduled;
                                    return (
                                        <tr key={a.id}>
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{a.title}</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                                                <div>{a.contact_name || '—'}</div>
                                                {a.contact_phone && <div className="font-mono text-xs text-neutral-400">{a.contact_phone}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">{a.agent_name || '—'}</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{fmtDate(a.scheduled_at)}</td>
                                            <td className="px-4 py-3 text-neutral-500">{a.duration_minutes} min</td>
                                            <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {a.status !== 'completed' && <button title="Mark completed" onClick={() => setRowStatus(a, 'completed')} className="rounded-soft p-1.5 text-cold-600 hover:bg-cold-500/10"><Check className="h-4 w-4" /></button>}
                                                    {a.status !== 'cancelled' && <button title="Cancel" onClick={() => setRowStatus(a, 'cancelled')} className="rounded-soft p-1.5 text-warm-600 hover:bg-warm-500/10"><Ban className="h-4 w-4" /></button>}
                                                    {a.status !== 'scheduled' && <button title="Reschedule (mark scheduled)" onClick={() => setRowStatus(a, 'scheduled')} className="rounded-soft p-1.5 text-signal-600 hover:bg-signal-500/10"><Clock className="h-4 w-4" /></button>}
                                                    <button title="Delete" onClick={() => remove(a)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center"><CalendarClock className="mx-auto mb-3 h-12 w-12 text-neutral-300" /><p className="text-neutral-500">No appointments yet. Create one to get started.</p></div>
                    )}
                </div>

                <Pagination data={appointments} />
            </div>

            {showModal && <AddModal agents={agents} contacts={contacts} onClose={() => setShowModal(false)} />}
        </ClientLayout>
    );
}
