'use client';

import { useState, useEffect } from 'react';
import { router } from '@/lib/page-router';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dropdown } from '@/components/ui';
import { GripVertical, MoreVertical, Pencil, Copy, Power, PowerOff, Trash2 } from 'lucide-react';
import { useMoney } from '@/lib/money';

function FeaturesSummary({ features = [], limits = {} }) {
    const displayItems = [];
    if (Array.isArray(features)) {
        features.forEach((f) => {
            if (f && String(f).trim()) displayItems.push(String(f).trim());
        });
    }
    const limitLabels = {
        ai_credits: 'AI Credits',
        sites: 'Sites',
        users: 'Team',
    };
    Object.entries(limits || {}).forEach(([key, val]) => {
        if (val != null && val !== '' && limitLabels[key]) {
            displayItems.push(`${limitLabels[key]}: ${val}`);
        }
    });
    const first3 = displayItems.slice(0, 3);
    const rest = displayItems.length - 3;
    return (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {first3.length === 0 && '—'}
            {first3.map((item, i) => (
                <div key={i}>{item}</div>
            ))}
            {rest > 0 && <div className="text-neutral-500 dark:text-neutral-500">+{rest} more</div>}
        </div>
    );
}

function StatusCell({ plan }) {
    return (
        <div className="flex flex-wrap gap-1">
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    plan.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
            >
                {plan.enabled ? 'Active' : 'Disabled'}
            </span>
            {plan.popular && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Popular
                </span>
            )}
            {plan.featured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                    Featured
                </span>
            )}
        </div>
    );
}

function SortableRow({ plan, onEdit, onDuplicate, onToggleEnabled, onDelete }) {
    const money = useMoney();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: plan.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b border-neutral-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${isDragging ? 'opacity-60 bg-white dark:bg-neutral-900' : ''}`}
        >
            <td className="py-3 px-4 w-10">
                <button
                    type="button"
                    className="p-1 rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </td>
            <td className="py-3 px-4">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{plan.name}</span>
            </td>
            <td className="py-3 px-4 max-w-[180px]">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {plan.description || '—'}
                </span>
            </td>
            <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {plan.monthly_price_cents != null ? money(plan.monthly_price_cents, plan.currency_code, { decimals: 0 }) : '—'}
            </td>
            <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {plan.yearly_price_cents != null ? money(plan.yearly_price_cents, plan.currency_code, { decimals: 0 }) : '—'}
            </td>
            <td className="py-3 px-4">
                <FeaturesSummary features={plan.features} limits={plan.limits} />
            </td>
            <td className="py-3 px-4">
                <StatusCell plan={plan} />
            </td>
            <td className="py-3 px-4 text-right">
                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition"
                            aria-label="Actions"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="right" width="56">
                        <Dropdown.Item onClick={() => onEdit(plan)}>
                            <Pencil className="h-4 w-4 mr-2 inline" />
                            Edit Plan
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onDuplicate(plan)}>
                            <Copy className="h-4 w-4 mr-2 inline" />
                            Duplicate Plan
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onToggleEnabled(plan)}>
                            {plan.enabled ? (
                                <>
                                    <PowerOff className="h-4 w-4 mr-2 inline" />
                                    Disable
                                </>
                            ) : (
                                <>
                                    <Power className="h-4 w-4 mr-2 inline" />
                                    Enable
                                </>
                            )}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item
                            onClick={() => onDelete(plan)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4 mr-2 inline" />
                            Delete Plan
                        </Dropdown.Item>
                    </Dropdown.Content>
                </Dropdown>
            </td>
        </tr>
    );
}

export default function PlanTable({
    plans = [],
    onEdit,
    onDuplicate,
    onToggleEnabled,
    onDelete,
    onReorder,
}) {
    const idsKey = plans.map((p) => p.id).join(',');
    const [order, setOrder] = useState(() => plans.map((p) => p.id));
    useEffect(() => {
        setOrder(plans.map((p) => p.id));
    }, [idsKey]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const orderedPlans = order
        .map((id) => plans.find((p) => p.id === id))
        .filter(Boolean);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = order.indexOf(active.id);
        const newIndex = order.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);
        onReorder(newOrder);
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/*
              DndContext renders a hidden accessibility <div>, so it has to sit
              outside the table — a <div> inside <tbody> is invalid HTML.
              SortableContext renders no DOM of its own and can stay in <tbody>.
            */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-left text-neutral-500 dark:text-neutral-400">
                                <th className="py-3 px-4 w-10 font-medium"></th>
                                <th className="py-3 px-4 font-medium">NAME</th>
                                <th className="py-3 px-4 font-medium">DESCRIPTION</th>
                                <th className="py-3 px-4 font-medium">MONTHLY</th>
                                <th className="py-3 px-4 font-medium">YEARLY</th>
                                <th className="py-3 px-4 font-medium">FEATURES</th>
                                <th className="py-3 px-4 font-medium">STATUS</th>
                                <th className="py-3 px-4 text-right font-medium">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <SortableContext
                                items={order}
                                strategy={verticalListSortingStrategy}
                            >
                                {orderedPlans.map((plan) => (
                                    <SortableRow
                                        key={plan.id}
                                        plan={plan}
                                        onEdit={onEdit}
                                        onDuplicate={onDuplicate}
                                        onToggleEnabled={onToggleEnabled}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </div>
            </DndContext>
            {plans.length === 0 && (
                <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                    No plans yet. Add your first plan to get started.
                </div>
            )}
        </div>
    );
}

export { FeaturesSummary, StatusCell };
