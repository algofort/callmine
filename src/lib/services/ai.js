import 'server-only';

import config from '@/lib/config';
import { integrationConfig, integrationEnabled } from '@/lib/services/integrations';

/** Port of App\Services\AI\OpenAIProvider and AIProviderRegistry. */

/** Admin DB settings first, then config()/env. */
async function adminSettings() {
    const db = await integrationConfig('openai');
    const enabled = await integrationEnabled('openai', config.ai.providers.openai.enabled);
    return [db, enabled];
}

export async function openAiKey() {
    const [db, enabled] = await adminSettings();
    if (!enabled) return null;
    return db.api_key ?? config.ai.providers.openai.api_key;
}

/** — null when unconfigured or disabled. */
export async function defaultAiProvider() {
    const [db, enabled] = await adminSettings();
    const apiKey = db.api_key ?? config.ai.providers.openai.api_key;
    if (!enabled || !apiKey) return null;

    return createOpenAIProvider(
        apiKey,
        db.model ?? config.ai.providers.openai.model,
        Number(db.max_tokens ?? config.ai.providers.openai.max_tokens),
    );
}

export async function aiIsConfigured() {
    const provider = await defaultAiProvider();
    return provider?.isConfigured() ?? false;
}

/** OpenAIProvider */
export function createOpenAIProvider(apiKey, model, maxTokens) {
    return {
        name: () => 'OpenAI',
        isConfigured: () => apiKey !== '' && apiKey !== '0',

        async complete(prompt, options = {}) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: options.model ?? model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.max_tokens ?? maxTokens,
                    temperature: options.temperature ?? 0.7,
                }),
                signal: AbortSignal.timeout((options.timeout ?? 120) * 1000),
            });

            if (!res.ok) {
                const body = await res.text();
                console.error('OpenAI API error', { status: res.status, body });
                throw new Error(`OpenAI request failed: ${body}`);
            }

            const data = await res.json();
            return {
                text: data?.choices?.[0]?.message?.content ?? '',
                tokens_used: Number(data?.usage?.total_tokens ?? 0),
            };
        },
    };
}
