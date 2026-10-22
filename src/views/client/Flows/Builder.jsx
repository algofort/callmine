'use client';

import { route } from '@/lib/route';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import {
    ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
    addEdge, applyNodeChanges, applyEdgeChanges, Handle, Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Zap, GitBranch, Play, Save, ArrowLeft, Trash2, X, PhoneCall, MessageSquare,
    MessageCircle, Mail, Clock, Tag, Users, Webhook, PhoneIncoming, CalendarClock,
    UserCheck, Hand, Thermometer, PhoneOff, AtSign,
} from 'lucide-react';

// ── Node catalogue ───────────────────────────────────────────────
const CAT = {
    trigger: { label: 'Trigger', icon: Zap, tile: 'bg-signal-500/15 text-signal-600 dark:text-signal-300', border: 'border-signal-300 dark:border-signal-500/40' },
    condition: { label: 'Condition', icon: GitBranch, tile: 'bg-warm/15 text-amber-600 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-500/40' },
    action: { label: 'Action', icon: Play, tile: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', border: 'border-brand-300 dark:border-brand-500/40' },
};

const PALETTE = [
    { category: 'trigger', kind: 'call_completed', label: 'Call completed', icon: PhoneCall },
    { category: 'trigger', kind: 'inbound_call', label: 'Inbound call', icon: PhoneIncoming },
    { category: 'trigger', kind: 'lead_qualified', label: 'Lead qualified', icon: UserCheck },
    { category: 'trigger', kind: 'schedule', label: 'Schedule', icon: CalendarClock },
    { category: 'trigger', kind: 'manual', label: 'Manual', icon: Hand },
    { category: 'condition', kind: 'lead_temperature', label: 'Lead temperature', icon: Thermometer },
    { category: 'condition', kind: 'call_outcome', label: 'Call outcome', icon: PhoneOff },
    { category: 'condition', kind: 'has_email', label: 'Has email', icon: AtSign },
    { category: 'action', kind: 'place_call', label: 'Place call', icon: PhoneCall },
    { category: 'action', kind: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { category: 'action', kind: 'send_whatsapp', label: 'Send WhatsApp', icon: MessageCircle },
    { category: 'action', kind: 'send_email', label: 'Send email', icon: Mail },
    { category: 'action', kind: 'wait', label: 'Wait', icon: Clock },
    { category: 'action', kind: 'add_tag', label: 'Add tag', icon: Tag },
    { category: 'action', kind: 'add_to_campaign', label: 'Add to campaign', icon: Users },
    { category: 'action', kind: 'webhook', label: 'Call webhook', icon: Webhook },
];

// ── Custom node ──────────────────────────────────────────────────
function FlowNode({ data, selected }) {
    const c = CAT[data.category] || CAT.action;
    const Icon = c.icon;
    return (
        <div className={`min-w-[168px] rounded-soft-lg border bg-white px-3 py-2 shadow-soft dark:bg-ink-900 ${c.border} ${selected ? 'ring-2 ring-brand-400' : ''}`}>
            <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-neutral-400 dark:!border-ink-900" />
            <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.tile}`}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">{c.label}</p>
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{data.label}</p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-neutral-400 dark:!border-ink-900" />
        </div>
    );
}

const nodeTypes = { flowNode: FlowNode };
let idSeq = 1;
const newId = () => `n_${Date.now()}_${idSeq++}`;

function Canvas({ flow, isNew, triggers, statuses }) {
    const def = flow.definition || { nodes: [], edges: [] };
    const [nodes, setNodes] = useState(def.nodes || []);
    const [edges, setEdges] = useState(def.edges || []);
    const [selectedId, setSelectedId] = useState(null);
    const wrapRef = useRef(null);

    const form = useForm({
        name: flow.name || 'Untitled flow',
        description: flow.description || '',
        status: flow.status || 'draft',
        trigger_type: flow.trigger_type || 'manual',
    });

    const onNodesChange = useCallback((c) => setNodes((ns) => applyNodeChanges(c, ns)), []);
    const onEdgesChange = useCallback((c) => setEdges((es) => applyEdgeChanges(c, es)), []);
    const onConnect = useCallback((p) => setEdges((es) => addEdge({ ...p, id: `e_${p.source}-${p.target}` }, es)), []);

    const addNode = (item) => {
        const id = newId();
        const y = 40 + nodes.length * 40;
        setNodes((ns) => ns.concat({
            id, type: 'flowNode',
            position: { x: 120 + (nodes.length % 3) * 40, y },
            data: { label: item.label, category: item.category, kind: item.kind, config: {} },
        }));
        setSelectedId(id);
    };

    const selected = nodes.find((n) => n.id === selectedId) || null;
    const patchSelected = (patch) => setNodes((ns) => ns.map((n) => n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n));
    const deleteSelected = () => { setNodes((ns) => ns.filter((n) => n.id !== selectedId)); setEdges((es) => es.filter((e) => e.source !== selectedId && e.target !== selectedId)); setSelectedId(null); };

    const serialize = () => ({
        ...form.data,
        definition: {
            nodes: nodes.map((n) => ({ id: n.id, type: 'flowNode', position: n.position, data: n.data })),
            edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        },
    });

    const save = () => {
        const payload = serialize();
        if (isNew) router.post(route('client.flows.store'), payload, { preserveScroll: true });
        else router.put(route('client.flows.update', flow.id), payload, { preserveScroll: true });
    };
    const run = () => router.post(route('client.flows.run', flow.id), {}, { preserveScroll: true });

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 rounded-soft-lg border border-neutral-200 bg-white p-3 shadow-soft dark:border-ink-800 dark:bg-ink-900">
                <Link href={route('client.flows.index')} className="rounded-soft p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-ink-800"><ArrowLeft className="h-4 w-4" /></Link>
                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="min-w-[180px] flex-1 rounded-soft border border-transparent bg-transparent px-2 py-1.5 font-display text-lg font-semibold text-neutral-900 hover:border-neutral-200 focus:border-brand-300 dark:text-white dark:hover:border-ink-700" placeholder="Flow name" />
                <select value={form.data.trigger_type} onChange={(e) => form.setData('trigger_type', e.target.value)} className="rounded-soft border border-neutral-200 bg-white px-2.5 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-900">
                    {triggers.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} className="rounded-soft border border-neutral-200 bg-white px-2.5 py-1.5 text-sm capitalize dark:border-ink-700 dark:bg-ink-900">
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {!isNew && <button onClick={run} className="inline-flex items-center gap-1.5 rounded-soft border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-300 dark:hover:bg-ink-800"><Play className="h-4 w-4" /> Run</button>}
                <button onClick={save} disabled={form.processing} className="inline-flex items-center gap-1.5 rounded-soft bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Save className="h-4 w-4" /> Save</button>
            </div>

            <div className="flex gap-3">
                {/* Palette */}
                <div className="hidden w-48 shrink-0 space-y-3 sm:block">
                    {['trigger', 'condition', 'action'].map((cat) => (
                        <div key={cat} className="rounded-soft-lg border border-neutral-200 bg-white p-2.5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
                            <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{CAT[cat].label}s</p>
                            <div className="space-y-1">
                                {PALETTE.filter((p) => p.category === cat).map((p) => {
                                    const Icon = p.icon;
                                    return (
                                        <button key={p.kind} onClick={() => addNode(p)} className="flex w-full items-center gap-2 rounded-soft px-2 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-ink-800">
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${CAT[cat].tile}`}><Icon className="h-3.5 w-3.5" /></span>
                                            <span className="truncate">{p.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Canvas */}
                <div ref={wrapRef} className="relative h-[68vh] flex-1 overflow-hidden rounded-soft-lg border border-neutral-200 bg-neutral-50 shadow-soft dark:border-ink-800 dark:bg-ink-950">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(_, n) => setSelectedId(n.id)}
                        onPaneClick={() => setSelectedId(null)}
                        fitView
                        proOptions={{ hideAttribution: true }}
                        defaultEdgeOptions={{ animated: true, style: { stroke: '#8a67f2', strokeWidth: 2 } }}
                    >
                        <Background gap={18} color="#c7c7d1" />
                        <Controls showInteractive={false} />
                        <MiniMap pannable zoomable nodeColor={(n) => ({ trigger: '#16d9a8', condition: '#ffb23e', action: '#6d3fea' }[n.data?.category] || '#6d3fea')} className="!bg-white dark:!bg-ink-900" />
                    </ReactFlow>
                    {nodes.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <p className="rounded-soft bg-white/80 px-3 py-1.5 text-sm text-neutral-400 backdrop-blur dark:bg-ink-900/80">Click a block on the left to add it →</p>
                        </div>
                    )}
                </div>

                {/* Config panel */}
                {selected && (
                    <div className="hidden w-64 shrink-0 rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 lg:block">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{CAT[selected.data.category]?.label} settings</p>
                            <button onClick={() => setSelectedId(null)} className="rounded-soft p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-ink-800"><X className="h-4 w-4" /></button>
                        </div>
                        <label className="mt-3 block text-xs font-medium text-neutral-500">Label</label>
                        <input value={selected.data.label} onChange={(e) => patchSelected({ label: e.target.value })} className="mt-1 w-full rounded-soft border border-neutral-200 bg-white px-2.5 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-950" />
                        <label className="mt-3 block text-xs font-medium text-neutral-500">Notes / parameters</label>
                        <textarea rows="4" value={selected.data.config?.note || ''} onChange={(e) => patchSelected({ config: { ...selected.data.config, note: e.target.value } })} placeholder="e.g. message text, delay, tag name…" className="mt-1 w-full rounded-soft border border-neutral-200 bg-white px-2.5 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-950" />
                        <p className="mt-3 text-[11px] text-neutral-400">Type: <span className="font-mono">{selected.data.kind}</span></p>
                        <button onClick={deleteSelected} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-soft border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Delete step</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FlowBuilder({ flow, isNew, triggers = [], statuses = [] }) {
    return (
        <ClientLayout title={isNew ? 'New flow' : flow.name}>
            <Head title={isNew ? 'New flow' : `${flow.name} · Flow`} />
            <ReactFlowProvider>
                <Canvas flow={flow} isNew={isNew} triggers={triggers} statuses={statuses} />
            </ReactFlowProvider>
        </ClientLayout>
    );
}
