'use client';

import { route } from '@/lib/route';
import AdminLayout from '@/layouts/AdminLayout';
import PageOverview from '@/components/PageOverview';
import { Badge, Button, Card, Modal, Tabs } from '@/components/ui';
import { Head, router, useForm, usePage } from '@/lib/page-router';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function AdminRolesPermissionsIndex({ roles = [], permissions = [], filters = {}, flash }) {
    const { auth } = usePage().props;
    const pageFlash = usePage().props.flash || flash;
    const permissionsList = auth?.permissions ?? [];
    const canManageRoles = permissionsList.includes('manage_admin_roles');

    const [tabIndex, setTabIndex] = useState(0);
    const [roleSearch, setRoleSearch] = useState(filters.role_search ?? '');
    const [permissionSearch, setPermissionSearch] = useState(filters.permission_search ?? '');

    const [addRoleOpen, setAddRoleOpen] = useState(false);
    const [editRoleOpen, setEditRoleOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [deleteRoleConfirm, setDeleteRoleConfirm] = useState(null);

    const [addPermOpen, setAddPermOpen] = useState(false);
    const [editPermOpen, setEditPermOpen] = useState(false);
    const [editingPerm, setEditingPerm] = useState(null);
    const [deletePermConfirm, setDeletePermConfirm] = useState(null);

    const roleForm = useForm({ name: '', key: '', description: '', permission_ids: [] });
    const editRoleForm = useForm({ name: '', key: '', description: '', permission_ids: [] });
    const permForm = useForm({ key: '', name: '', category: '', description: '' });
    const editPermForm = useForm({ key: '', name: '', category: '', description: '' });

    const submitRoleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.roles-permissions.index'), { role_search: roleSearch || undefined, permission_search: permissionSearch || undefined }, { preserveState: true });
    };

    const submitPermissionSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.roles-permissions.index'), { role_search: roleSearch || undefined, permission_search: permissionSearch || undefined }, { preserveState: true });
    };

    const openEditRole = (role) => {
        setEditingRole(role);
        editRoleForm.setData({
            name: role.name,
            key: role.key,
            description: role.description ?? '',
            permission_ids: role.permission_ids ?? [],
        });
        setEditRoleOpen(true);
    };

    const openEditPermission = (perm) => {
        setEditingPerm(perm);
        editPermForm.setData({
            key: perm.key,
            name: perm.name,
            category: perm.category,
            description: perm.description ?? '',
        });
        setEditPermOpen(true);
    };

    const categories = [...new Set((permissions || []).map((p) => p.category))].sort();

    return (
        <AdminLayout title="Roles & Permissions">
            <Head title="Roles & Permissions · Admin" />
            <div className="space-y-6">
                {pageFlash?.success && (
                    <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{pageFlash.success}</div>
                )}
                {pageFlash?.error && (
                    <div className="rounded-soft-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 text-sm">{pageFlash.error}</div>
                )}
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Roles & Permissions</h2>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Manage roles and permissions for the admin panel.</p>
                </div>

                <PageOverview feature="admin-roles" />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <Card.Body>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Roles</p>
                            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{roles?.length ?? 0}</p>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Permissions</p>
                            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{permissions?.length ?? 0}</p>
                        </Card.Body>
                    </Card>
                </div>

                <Tabs tabs={[{ label: 'Roles' }, { label: 'Permissions' }]} defaultIndex={0} onChange={(i) => setTabIndex(i)}>
                    <div className="py-4">
                        {tabIndex === 0 && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <form onSubmit={submitRoleSearch} className="flex gap-2">
                                        <input type="text" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search roles" className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm w-48" />
                                        <Button type="submit" variant="outline" size="sm">Search</Button>
                                    </form>
                                    {canManageRoles && <Button onClick={() => setAddRoleOpen(true)}>Add Role</Button>}
                                </div>
                                <Card>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                                                    <th className="pb-2 pr-4 font-medium">Role Name</th>
                                                    <th className="pb-2 pr-4 font-medium">Description</th>
                                                    <th className="pb-2 pr-4 font-medium">Permissions</th>
                                                    <th className="pb-2 pr-4 font-medium">Admins</th>
                                                    <th className="pb-2 pr-4 w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(roles || []).map((r) => (
                                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                                        <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">{r.name}</td>
                                                        <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">{r.description || '—'}</td>
                                                        <td className="py-3 pr-4"><Badge variant="default" size="sm">{r.permissions_count ?? 0}</Badge></td>
                                                        <td className="py-3 pr-4">{r.admins_count ?? 0}</td>
                                                        <td className="py-3 pr-4">
                                                            {canManageRoles && !r.is_system && (
                                                                <div className="flex gap-1">
                                                                    <button type="button" onClick={() => openEditRole(r)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Edit"><Pencil className="h-4 w-4" /></button>
                                                                    <button type="button" onClick={() => setDeleteRoleConfirm(r)} className="rounded-soft p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                                                </div>
                                                            )}
                                                            {r.is_system && <span className="text-xs text-neutral-400">System</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {(!roles || roles.length === 0) && <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">No roles found.</div>}
                                </Card>
                            </div>
                        )}

                        {tabIndex === 1 && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <form onSubmit={submitPermissionSearch} className="flex gap-2">
                                        <input type="text" value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} placeholder="Search key, name, category" className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm w-56" />
                                        <Button type="submit" variant="outline" size="sm">Search</Button>
                                    </form>
                                    {canManageRoles && <Button onClick={() => setAddPermOpen(true)}>Add Permission</Button>}
                                </div>
                                <Card>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                                                    <th className="pb-2 pr-4 font-medium">Key</th>
                                                    <th className="pb-2 pr-4 font-medium">Name</th>
                                                    <th className="pb-2 pr-4 font-medium">Category</th>
                                                    <th className="pb-2 pr-4 font-medium">Description</th>
                                                    <th className="pb-2 pr-4 w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(permissions || []).map((p) => (
                                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                                        <td className="py-3 pr-4 font-mono text-neutral-900 dark:text-neutral-100">{p.key}</td>
                                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{p.name}</td>
                                                        <td className="py-3 pr-4"><Badge variant="default" size="sm">{p.category}</Badge></td>
                                                        <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">{p.description || '—'}</td>
                                                        <td className="py-3 pr-4">
                                                            {canManageRoles && (
                                                                <div className="flex gap-1">
                                                                    <button type="button" onClick={() => openEditPermission(p)} className="rounded-soft p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Edit"><Pencil className="h-4 w-4" /></button>
                                                                    <button type="button" onClick={() => setDeletePermConfirm(p)} className="rounded-soft p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {(!permissions || permissions.length === 0) && <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">No permissions found.</div>}
                                </Card>
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Add Role Modal */}
            <Modal show={addRoleOpen} onClose={() => setAddRoleOpen(false)} maxWidth="2xl">
                <Modal.Header title="Add Role" onClose={() => setAddRoleOpen(false)} />
                <form onSubmit={(e) => { e.preventDefault(); roleForm.post(route('admin.roles.store'), { onSuccess: () => { setAddRoleOpen(false); roleForm.reset(); } }); }}>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input type="text" value={roleForm.data.name} onChange={(e) => roleForm.setData('name', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                {roleForm.errors.name && <p className="mt-1 text-sm text-red-500">{roleForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Key (e.g. SUPPORT)</label>
                                <input type="text" value={roleForm.data.key} onChange={(e) => roleForm.setData('key', e.target.value.toUpperCase())} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono" placeholder="SUPPORT" required />
                                {roleForm.errors.key && <p className="mt-1 text-sm text-red-500">{roleForm.errors.key}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input type="text" value={roleForm.data.description} onChange={(e) => roleForm.setData('description', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Permissions (by category)</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 border border-neutral-200 dark:border-neutral-700 rounded-soft p-3">
                                    {categories.map((cat) => (
                                        <div key={cat}>
                                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">{cat}</p>
                                            {permissions.filter((p) => p.category === cat).map((p) => (
                                                <label key={p.id} className="flex items-center gap-2 ml-2">
                                                    <input type="checkbox" checked={roleForm.data.permission_ids.includes(p.id)} onChange={(e) => { const ids = e.target.checked ? [...roleForm.data.permission_ids, p.id] : roleForm.data.permission_ids.filter((id) => id !== p.id); roleForm.setData('permission_ids', ids); }} className="rounded" />
                                                    <span className="text-sm">{p.key}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="button" variant="outline" onClick={() => setAddRoleOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={roleForm.processing}>Create</Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Edit Role Modal */}
            <Modal show={editRoleOpen} onClose={() => { setEditRoleOpen(false); setEditingRole(null); }} maxWidth="2xl">
                <Modal.Header title="Edit Role" onClose={() => { setEditRoleOpen(false); setEditingRole(null); }} />
                {editingRole && (
                    <form onSubmit={(e) => { e.preventDefault(); editRoleForm.put(route('admin.roles.update', editingRole.id), { onSuccess: () => { setEditRoleOpen(false); setEditingRole(null); } }); }}>
                        <Modal.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input type="text" value={editRoleForm.data.name} onChange={(e) => editRoleForm.setData('name', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                    {editRoleForm.errors.name && <p className="mt-1 text-sm text-red-500">{editRoleForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Key</label>
                                    <input type="text" value={editRoleForm.data.key} onChange={(e) => editRoleForm.setData('key', e.target.value.toUpperCase())} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono" required readOnly={editingRole?.is_system} />
                                    {editRoleForm.errors.key && <p className="mt-1 text-sm text-red-500">{editRoleForm.errors.key}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <input type="text" value={editRoleForm.data.description} onChange={(e) => editRoleForm.setData('description', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Permissions</label>
                                    <div className="max-h-48 overflow-y-auto space-y-2 border border-neutral-200 dark:border-neutral-700 rounded-soft p-3">
                                        {categories.map((cat) => (
                                            <div key={cat}>
                                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">{cat}</p>
                                                {permissions.filter((p) => p.category === cat).map((p) => (
                                                    <label key={p.id} className="flex items-center gap-2 ml-2">
                                                        <input type="checkbox" checked={editRoleForm.data.permission_ids.includes(p.id)} onChange={(e) => { const ids = e.target.checked ? [...editRoleForm.data.permission_ids, p.id] : editRoleForm.data.permission_ids.filter((id) => id !== p.id); editRoleForm.setData('permission_ids', ids); }} className="rounded" />
                                                        <span className="text-sm">{p.key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button type="button" variant="outline" onClick={() => { setEditRoleOpen(false); setEditingRole(null); }}>Cancel</Button>
                            <Button type="submit" disabled={editRoleForm.processing}>Update</Button>
                        </Modal.Footer>
                    </form>
                )}
            </Modal>

            {/* Add Permission Modal */}
            <Modal show={addPermOpen} onClose={() => setAddPermOpen(false)}>
                <Modal.Header title="Add Permission" onClose={() => setAddPermOpen(false)} />
                <form onSubmit={(e) => { e.preventDefault(); permForm.post(route('admin.permissions.store'), { onSuccess: () => { setAddPermOpen(false); permForm.reset(); } }); }}>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key</label>
                                <input type="text" value={permForm.data.key} onChange={(e) => permForm.setData('key', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono" placeholder="view_something" required />
                                {permForm.errors.key && <p className="mt-1 text-sm text-red-500">{permForm.errors.key}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input type="text" value={permForm.data.name} onChange={(e) => permForm.setData('name', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                {permForm.errors.name && <p className="mt-1 text-sm text-red-500">{permForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input type="text" value={permForm.data.category} onChange={(e) => permForm.setData('category', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                {permForm.errors.category && <p className="mt-1 text-sm text-red-500">{permForm.errors.category}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input type="text" value={permForm.data.description} onChange={(e) => permForm.setData('description', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="button" variant="outline" onClick={() => setAddPermOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={permForm.processing}>Create</Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Edit Permission Modal */}
            <Modal show={editPermOpen} onClose={() => { setEditPermOpen(false); setEditingPerm(null); }}>
                <Modal.Header title="Edit Permission" onClose={() => { setEditPermOpen(false); setEditingPerm(null); }} />
                {editingPerm && (
                    <form onSubmit={(e) => { e.preventDefault(); editPermForm.put(route('admin.permissions.update', editingPerm.id), { onSuccess: () => { setEditPermOpen(false); setEditingPerm(null); } }); }}>
                        <Modal.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Key</label>
                                    <input type="text" value={editPermForm.data.key} onChange={(e) => editPermForm.setData('key', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono" required />
                                    {editPermForm.errors.key && <p className="mt-1 text-sm text-red-500">{editPermForm.errors.key}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input type="text" value={editPermForm.data.name} onChange={(e) => editPermForm.setData('name', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                    {editPermForm.errors.name && <p className="mt-1 text-sm text-red-500">{editPermForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <input type="text" value={editPermForm.data.category} onChange={(e) => editPermForm.setData('category', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" required />
                                    {editPermForm.errors.category && <p className="mt-1 text-sm text-red-500">{editPermForm.errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <input type="text" value={editPermForm.data.description} onChange={(e) => editPermForm.setData('description', e.target.value)} className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button type="button" variant="outline" onClick={() => { setEditPermOpen(false); setEditingPerm(null); }}>Cancel</Button>
                            <Button type="submit" disabled={editPermForm.processing}>Update</Button>
                        </Modal.Footer>
                    </form>
                )}
            </Modal>

            {/* Delete Role Confirm */}
            <Modal show={!!deleteRoleConfirm} onClose={() => setDeleteRoleConfirm(null)} maxWidth="sm">
                <Modal.Header title="Delete Role" onClose={() => setDeleteRoleConfirm(null)} />
                <Modal.Body>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Are you sure you want to delete role <strong>{deleteRoleConfirm?.name}</strong>? This cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline" onClick={() => setDeleteRoleConfirm(null)}>Cancel</Button>
                    <Button variant="danger" onClick={() => { router.delete(route('admin.roles.destroy', deleteRoleConfirm?.id), { preserveScroll: true }); setDeleteRoleConfirm(null); }}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Permission Confirm */}
            <Modal show={!!deletePermConfirm} onClose={() => setDeletePermConfirm(null)} maxWidth="sm">
                <Modal.Header title="Delete Permission" onClose={() => setDeletePermConfirm(null)} />
                <Modal.Body>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Are you sure you want to delete permission <strong>{deletePermConfirm?.key}</strong>? This cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline" onClick={() => setDeletePermConfirm(null)}>Cancel</Button>
                    <Button variant="danger" onClick={() => { router.delete(route('admin.permissions.destroy', deletePermConfirm?.id), { preserveScroll: true }); setDeletePermConfirm(null); }}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
}
