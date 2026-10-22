'use client';

import { route } from '@/lib/route';
import { Link } from '@/lib/page-router';
import { Bot, FileText } from 'lucide-react';

const TABS = [
    { key: 'agents', label: 'Agents', icon: Bot, route: 'client.agents.index' },
    { key: 'templates', label: 'Prompt Templates', icon: FileText, route: 'client.prompt-templates.index' },
];

/**
 * Shared sub-navigation for the Agent workspace (Agents · Prompt Templates · Voices).
 * Underline-style tabs — pass the active tab key.
 */
export default function AgentTabs({ active }) {
    return (
        <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-ink-800">
            {TABS.map((t) => {
                const Icon = t.icon;
                const on = t.key === active;
                return (
                    <Link
                        key={t.key}
                        href={route(t.route)}
                        className={`group relative -mb-px inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${on
                            ? 'text-brand-600 dark:text-brand-300'
                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                    >
                        <Icon className={`h-4 w-4 ${on ? '' : 'opacity-70 group-hover:opacity-100'}`} />
                        {t.label}
                        <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} />
                    </Link>
                );
            })}
        </div>
    );
}
