import 'server-only';

import prisma from '@/lib/prisma';

/** Port of App\Services\Flows\FlowTemplates and FlowRunner. */

export const TRIGGERS = ['manual', 'call_completed', 'inbound_call', 'lead_qualified', 'schedule'];
export const STATUSES = ['draft', 'active', 'paused'];

/** — lays the rows out vertically and wires them in sequence. */
function def(rows) {
    const nodes = [];
    const edges = [];
    let prev = null;

    for (const [type, kind, label, i] of rows) {
        const id = `n${i + 1}`;
        nodes.push({
            id,
            type: 'flowNode',
            position: { x: 240, y: 40 + i * 130 },
            data: { label, category: type, kind, config: {} },
        });
        if (prev !== null) edges.push({ id: `e${prev}-${id}`, source: prev, target: id });
        prev = id;
    }

    return { nodes, edges };
}

export function flowTemplates() {
    return [
        {
            key: 'lead_followup',
            name: 'Lead follow-up',
            description: 'After a call, text hot leads and schedule a callback.',
            icon: 'target',
            accent: 'brand',
            trigger_type: 'call_completed',
            definition: def([
                ['trigger', 'call_completed', 'Call completed', 0],
                ['condition', 'lead_temperature', 'Is hot lead?', 1],
                ['action', 'send_sms', 'Send follow-up SMS', 2],
                ['action', 'schedule_callback', 'Schedule callback', 3],
            ]),
        },
        {
            key: 'missed_call_textback',
            name: 'Missed-call text-back',
            description: 'Instantly text anyone whose inbound call went unanswered.',
            icon: 'phone',
            accent: 'signal',
            trigger_type: 'inbound_call',
            definition: def([
                ['trigger', 'inbound_call', 'Missed inbound call', 0],
                ['action', 'send_sms', 'Text back "Sorry we missed you"', 1],
                ['action', 'add_tag', 'Tag: missed-call', 2],
            ]),
        },
        {
            key: 'post_call_survey',
            name: 'Post-call survey',
            description: 'Send a satisfaction survey after every completed call.',
            icon: 'message',
            accent: 'warm',
            trigger_type: 'call_completed',
            definition: def([
                ['trigger', 'call_completed', 'Call completed', 0],
                ['action', 'send_sms', 'Send survey link', 1],
                ['condition', 'call_outcome', 'Responded?', 2],
                ['action', 'add_tag', 'Tag: surveyed', 3],
            ]),
        },
        {
            key: 'reengage_cold',
            name: 'Re-engage cold leads',
            description: 'On a schedule, place an AI call to cold leads to revive them.',
            icon: 'refresh',
            accent: 'cold',
            trigger_type: 'schedule',
            definition: def([
                ['trigger', 'schedule', 'Weekly schedule', 0],
                ['condition', 'lead_temperature', 'Is cold lead?', 1],
                ['action', 'place_call', 'Place AI re-engagement call', 2],
            ]),
        },
    ];
}

export function findFlowTemplate(key) {
    return flowTemplates().find((t) => t.key === key) ?? null;
}

export function nodeCount(flow) {
    return (flow?.definition?.nodes ?? []).length;
}

/**
 * — each node is simulated rather
 * than dispatching real side effects; kept identical so behaviour matches.
 */
function runNode(node) {
    const kind = node?.data?.kind ?? 'action';
    const label = node?.data?.label ?? 'Step';

    return { status: 'completed', message: `Simulated: ${label} (${kind})`, ms: 250 };
}

export async function runFlow(flow, source = 'manual') {
    const nodes = flow.definition?.nodes ?? [];

    return prisma.$transaction(async (tx) => {
        const execution = await tx.flowExecution.create({
            data: {
                client_id: flow.client_id,
                flow_id: flow.id,
                status: 'running',
                trigger_source: source,
                started_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        let failed = false;
        let durationMs = 0;

        for (const node of nodes) {
            const result = runNode(node);
            durationMs += result.ms;
            if (result.status === 'failed') failed = true;

            await tx.flowExecutionStep.create({
                data: {
                    flow_execution_id: execution.id,
                    node_id: node.id ?? '',
                    label: node?.data?.label ?? 'Step',
                    type: node?.data?.category ?? 'action',
                    status: result.status,
                    output: { message: result.message },
                    started_at: new Date(),
                    finished_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        const updated = await tx.flowExecution.update({
            where: { id: execution.id },
            data: {
                status: failed ? 'failed' : 'completed',
                finished_at: new Date(),
                duration_ms: durationMs,
                updated_at: new Date(),
            },
        });

        await tx.flow.update({
            where: { id: flow.id },
            data: { last_run_at: new Date(), updated_at: new Date() },
        });

        return updated;
    });
}
