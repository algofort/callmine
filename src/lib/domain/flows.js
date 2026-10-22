import { STATUSES, TRIGGERS } from '@/lib/services/flows';

/** rules. */
export function flowRules() {
    return {
        name: ['required', 'string', 'max:120'],
        description: ['nullable', 'string', 'max:255'],
        status: ['required', `in:${STATUSES.join(',')}`],
        trigger_type: ['nullable', `in:${TRIGGERS.join(',')}`],
        definition: ['nullable', 'array'],
    };
}
