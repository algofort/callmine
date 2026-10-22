import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';
import { plain } from '@/lib/serialize';
import { defaultEngine, enginesForUi } from '@/lib/services/integrations';

/** Shared pieces of Client\AgentController (form data + validation rules + costing). */

export async function agentFormData(clientId) {
    const voices = await prisma.voice.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, gender: true, accent: true, preview_url: true },
    });

    const knowledgeBase = await prisma.knowledgeBaseItem.findMany({
        where: { client_id: BigInt(clientId) },
        orderBy: { title: 'asc' },
        select: { id: true, title: true, type: true, status: true },
    });

    return plain({
        voices,
        llmModels: Object.entries(config.calling.llm_models).map(([value, m]) => ({
            value,
            label: m.label,
            cost_cents_per_min: m.cost_cents_per_min,
        })),
        voiceCostCents: config.calling.voice_cost_cents_per_min,
        engines: await enginesForUi(),
        defaultEngine: defaultEngine(),
        tones: ['Professional', 'Friendly', 'Casual', 'Empathetic', 'Authoritative'],
        personalities: ['Helpful', 'Persuasive', 'Assertive', 'Empathetic', 'Concise'],
        promptTemplates: [
            {
                label: 'Lead qualification',
                prompt: 'You are a friendly AI agent qualifying leads. Greet the contact, confirm their interest, ask qualifying questions about budget, need and timeline, and book a follow-up if they are a good fit.',
            },
            {
                label: 'Appointment reminder',
                prompt: 'You are calling to confirm an upcoming appointment. Confirm the date and time, offer to reschedule if needed, and thank them.',
            },
            {
                label: 'Customer survey',
                prompt: 'You are conducting a short satisfaction survey. Ask the contact to rate their experience from 1 to 5, capture any feedback, and thank them for their time.',
            },
        ],
        knowledgeBase,
    });
}

/** rules. */
export function agentRules() {
    const models = Object.keys(config.calling.llm_models);
    const engines = Object.keys(config.calling.engines);

    return {
        name: ['required', 'string', 'max:255'],
        voice_id: ['nullable', 'exists:voices,id'],
        language: ['required', 'string', 'max:16'],
        llm_model: ['required', 'string', `in:${models.join(',')}`],
        engine: ['required', 'string', `in:${engines.join(',')}`],
        temperature: ['required', 'numeric', 'between:0,1'],
        tone: ['nullable', 'string', 'max:64'],
        personality: ['nullable', 'string', 'max:64'],
        system_prompt: ['nullable', 'string', 'max:8000'],
        greeting: ['nullable', 'string', 'max:1000'],
        status: ['required', 'string', 'in:draft,active,archived'],
    };
}

export function costForModel(model) {
    const voice = config.calling.voice_cost_cents_per_min;
    const llm = config.calling.llm_models[model]?.cost_cents_per_min ?? 1;
    return voice + llm;
}

/** Maps validated input onto Prisma column types. */
export function agentData(input) {
    return {
        name: input.name,
        voice_id: input.voice_id ? BigInt(input.voice_id) : null,
        language: input.language,
        llm_model: input.llm_model,
        engine: input.engine,
        temperature: Number(input.temperature),
        tone: input.tone ?? null,
        personality: input.personality ?? null,
        system_prompt: input.system_prompt ?? null,
        greeting: input.greeting ?? null,
        status: input.status,
        cost_per_minute_cents: costForModel(input.llm_model),
    };
}
