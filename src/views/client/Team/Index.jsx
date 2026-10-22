'use client';

import { route } from '@/lib/route';
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Users, Plus, Pencil, Trash2, Shield, X } from 'lucide-react';

const inputCls = 'w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm';

function MemberModal({ roles, member, onClose }) {
    const editing = Boolean(member?.id);
    const form = useForm({ name: member?.name || '', email: member?.email || '', password: '', role_id: member?.role?.id || roles[0]?.id || '', status: member?.status || 'active' });
    const submit = (e) => { e.preventDefault(); const o = { preserveScroll: true, onSuccess: onClose }; editing ? form.put(route('client.team.update', member.id), o) : form.post(route('client.team.store'), o); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">{editing ? 'Edit member' : 'Add member'}</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <input className={inputCls} placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                {form.errors.email && <p className="text-xs text-danger">{form.errors.email}</p>}
                <input type="password" className={inputCls} placeholder={editing ? 'New password (optional)' : 'Password'} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <select className={inputCls} value={form.data.role_id} onChange={(e) => form.setData('role_id', e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                    <select className={inputCls} value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">{editing ? 'Save' : 'Add'}</button></div>
            </form>
        </div>
    );
}

function RoleModal({ role, catalog, onClose }) {
    const editing = Boolean(role?.id);
    const form = useForm({ name: role?.name || '', permissions: role?.permissions || [] });
    const modules = useMemo(() => { const m = {}; catalog.forEach((p) => { (m[p.module] ||= []).push(p); }); return m; }, [catalog]);
    const toggle = (k) => form.setData('permissions', form.data.permissions.includes(k) ? form.data.permissions.filter((x) => x !== k) : [...form.data.permissions, k]);
    const submit = (e) => { e.preventDefault(); const o = { preserveScroll: true, onSuccess: onClose }; editing ? form.put(route('client.team.roles.update', role.id), o) : form.post(route('client.team.roles.store'), o); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} className="max-h-[88vh] w-full max-w-lg space-y-3 overflow-auto rounded-soft-lg bg-white dark:bg-ink-900 p-5 shadow-soft-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">{editing ? `Edit role: ${role.name}` : 'New role'}</h3><button type="button" onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button></div>
                <input className={inputCls} placeholder="Role name" disabled={role?.is_system} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <div className="space-y-3">
                    {Object.entries(modules).map(([mod, perms]) => (
                        <div key={mod}><p className="mb-1 text-xs font-medium uppercase text-neutral-500">{mod}</p><div className="flex flex-wrap gap-2">{perms.map((p) => <label key={p.key} className="flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300"><input type="checkbox" checked={form.data.permissions.includes(p.key)} onChange={() => toggle(p.key)} /> {p.action}</label>)}</div></div>
                    ))}
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-soft px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-ink-800">Cancel</button><button type="submit" disabled={form.processing} className="rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50">Save</button></div>
            </form>
        </div>
    );
}

export default function TeamIndex({ users = [], roles = [], stats = [], permissionCatalog = [], seats = {}, customRolesEnabled = false }) {
    const [memberModal, setMemberModal] = useState(null);
    const [roleModal, setRoleModal] = useState(null);
    const removeMember = (u) => { if (confirm(`Remove ${u.name}?`)) router.delete(route('client.team.destroy', u.id), { preserveScroll: true }); };
    const removeRole = (r) => { if (confirm(`Delete role ${r.name}?`)) router.delete(route('client.team.roles.destroy', r.id), { preserveScroll: true }); };
    const assignRole = (u, roleId) => router.post(route('client.team.assign-role', u.id), { role_id: roleId }, { preserveScroll: true });

    return (
        <ClientLayout title="Team">
            <Head title="Team" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Team</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{seats.used ?? 0}/{seats.limit ?? 0} seats · role-based access control</p></div>
                    <button onClick={() => setMemberModal({})} disabled={(seats.used ?? 0) >= (seats.limit ?? 0)} className="inline-flex items-center gap-2 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Plus className="h-4 w-4" /> Add member</button>
                </div>

                <PageOverview feature="team" />

                <StatCards items={stats} />

                <div className="overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <table className="min-w-full divide-y divide-neutral-100 dark:divide-ink-800 text-sm">
                        <thead className="bg-neutral-50 dark:bg-ink-800/50"><tr>{['Member', 'Role', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-ink-800">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-4 py-3"><p className="font-medium text-neutral-900 dark:text-white">{u.name}</p><p className="text-xs text-neutral-400">{u.email}</p></td>
                                    <td className="px-4 py-3">{u.role?.id ? <select value={u.role.id} onChange={(e) => assignRole(u, e.target.value)} className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-2 py-1 text-xs">{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select> : <span className="text-xs text-neutral-400">{u.role?.name || '—'}</span>}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${u.status === 'active' ? 'bg-signal-100 text-signal-700 dark:bg-signal-500/20 dark:text-signal-300' : 'bg-neutral-100 text-neutral-500 dark:bg-ink-800'}`}>{u.status}</span></td>
                                    <td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => setMemberModal(u)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button><button onClick={() => removeMember(u)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-neutral-500"><Shield className="h-4 w-4" /> Roles</h2>
                        {customRolesEnabled && <button onClick={() => setRoleModal({})} className="inline-flex items-center gap-1 rounded-soft border border-neutral-200 dark:border-ink-700 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-ink-800"><Plus className="h-3.5 w-3.5" /> Custom role</button>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {roles.map((r) => (
                            <div key={r.id} className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
                                <div className="flex items-center justify-between"><p className="font-display font-semibold text-neutral-900 dark:text-white">{r.name}</p>{r.is_system && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 dark:bg-ink-800">system</span>}</div>
                                <p className="mt-1 text-xs text-neutral-500">{r.permissions.length} permissions</p>
                                <div className="mt-3 flex gap-1"><button onClick={() => setRoleModal(r)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>{!r.is_system && <button onClick={() => removeRole(r)} className="rounded-soft p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {memberModal && <MemberModal roles={roles} member={memberModal.id ? memberModal : null} onClose={() => setMemberModal(null)} />}
            {roleModal && <RoleModal role={roleModal.id ? roleModal : null} catalog={permissionCatalog} onClose={() => setRoleModal(null)} />}
        </ClientLayout>
    );
}
