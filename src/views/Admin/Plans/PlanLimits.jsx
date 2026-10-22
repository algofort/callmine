'use client';

import { Button, Input } from '@/components/ui';

const LIMIT_KEYS = [
    'products',
    'sales',
    'purchases',
    'customers',
    'suppliers',
    'users',
    'branches',
    'registers',
    'warehouses',
    'ai_credits',
    'sites',
    'storage',
];

const LABELS = {
    products: 'Products',
    sales: 'Sales',
    purchases: 'Purchases',
    customers: 'Customers',
    suppliers: 'Suppliers',
    users: 'Users',
    branches: 'Branches',
    registers: 'Registers',
    warehouses: 'Warehouses',
    ai_credits: 'AI Credits',
    sites: 'Sites',
    storage: 'Storage',
};

const DEFAULT_LIMITS = Object.fromEntries(LIMIT_KEYS.map((k) => [k, null]));

export default function PlanLimits({ limits = {}, onChange }) {
    const value = { ...DEFAULT_LIMITS, ...limits };

    const update = (key, v) => {
        const next = { ...value, [key]: v === '' || v === undefined ? null : Number(v) };
        onChange(next);
    };

    const setAllUnlimited = () => {
        onChange(Object.fromEntries(LIMIT_KEYS.map((k) => [k, null])));
    };

    const resetDefaults = () => {
        onChange({ ...DEFAULT_LIMITS });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Plan limits</span>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={setAllUnlimited}>
                        Set All Unlimited
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={resetDefaults}>
                        Reset Defaults
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {LIMIT_KEYS.map((key) => (
                    <Input
                        key={key}
                        type="number"
                        min={0}
                        label={LABELS[key]}
                        value={value[key] ?? ''}
                        onChange={(e) => update(key, e.target.value ? e.target.value : null)}
                        placeholder="Unlimited"
                    />
                ))}
            </div>
        </div>
    );
}
