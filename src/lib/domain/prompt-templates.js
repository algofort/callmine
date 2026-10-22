/** Port of App\Models\PromptTemplate's constants and helpers. */

export const CATEGORIES = ['agent_preset', 'sales', 'support', 'appointment', 'survey', 'general'];

/** Extract {{variable}} tokens from prompt content. */
export function extractVariables(content) {
    if (!content) return [];
    const found = [...String(content).matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
    return [...new Set(found)];
}

/** rules. */
export function templateRules() {
    return {
        name: ['required', 'string', 'max:120'],
        description: ['nullable', 'string', 'max:255'],
        category: ['required', `in:${CATEGORIES.join(',')}`],
        content: ['required', 'string', 'max:8000'],
    };
}
