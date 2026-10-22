'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Button, Card, Input } from '@/components/ui';
import { Head, router, usePage } from '@/lib/page-router';
import { useState } from 'react';

export default function TenantsIndex({ tenants = [], stats = [] }) {
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const currentTenant = usePage().props.currentTenant;

    const handleSwitch = (tenantId) => {
        router.post(route('client.tenants.switch'), { tenant_id: tenantId }, { preserveScroll: true });
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        router.post(route('client.tenants.store'), { name: name.trim() }, {
            preserveScroll: true,
            onFinish: () => {
                setCreating(false);
                setName('');
            },
        });
    };

    return (
        <ClientLayout title="Workspaces">
            <Head title="Workspaces" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900">Workspaces</h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            Switch workspace or create a new one. Your calling data is scoped per workspace.
                        </p>
                    </div>
                </div>

                <PageOverview feature="tenants" />

                <StatCards items={stats} />

                <Card>
                    <Card.Body>
                        <h3 className="text-sm font-semibold text-neutral-800 mb-3">Create workspace</h3>
                        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Input
                                label="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My workspace"
                                className="sm:max-w-xs"
                            />
                            <Button type="submit" variant="primary" disabled={creating || !name.trim()}>
                                {creating ? 'Creating…' : 'Create'}
                            </Button>
                        </form>
                    </Card.Body>
                </Card>

                <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-2">Your workspaces</h3>
                    {tenants.length === 0 ? (
                        <Card>
                            <Card.Body>
                                <p className="text-neutral-500">No workspaces yet. Create one above.</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <ul className="space-y-2">
                            {tenants.map((t) => (
                                <li key={t.id}>
                                    <Card>
                                        <Card.Body className="flex flex-row items-center justify-between py-3">
                                            <span className="font-medium text-neutral-900">{t.name}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSwitch(t.id)}
                                                disabled={currentTenant?.id === t.id}
                                            >
                                                {currentTenant?.id === t.id ? 'Current' : 'Switch'}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}


