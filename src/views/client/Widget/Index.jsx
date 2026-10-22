'use client';

import { route } from '@/lib/route';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { Head, useForm, usePage } from '@/lib/page-router';
import { useState } from 'react';
import {
    Globe,
    MessageCircle,
    Copy,
    Check,
    X,
    Send,
    Bot,
} from 'lucide-react';

export default function WidgetIndex({ config = {}, agents = [], stats = [] }) {
    const { flash = {} } = usePage().props;
    const [copied, setCopied] = useState(false);

    const form = useForm({
        title: config.title ?? 'Chat with us',
        welcome_message: config.welcome_message ?? '',
        primary_color: config.primary_color ?? '#6d3fea',
        position: config.position ?? 'bottom-right',
        agent_id: config.agent_id ?? '',
        enabled: config.enabled ?? false,
    });

    const snippet = `<script src="https://YOURDOMAIN/widget/${config.public_token ?? 'TOKEN'}.js" async></script>`;

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put(route('client.website-widget.update'), { preserveScroll: true });
    };

    const copySnippet = async () => {
        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (_) {
            // clipboard unavailable
        }
    };

    const alignRight = form.data.position === 'bottom-right';

    return (
        <ClientLayout title="Website Widget">
            <Head title="Website Widget" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Globe className="h-6 w-6 text-brand-500" />
                        Website Widget
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Embed an AI chat widget on your website.
                    </p>
                </div>

                <PageOverview feature="website-widget" />
                <StatCards items={stats} />

                {flash?.success && (
                    <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        {flash.success}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* LEFT: Config form */}
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-soft-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 shadow-soft space-y-5"
                    >
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            Configuration
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                            />
                            {form.errors.title && (
                                <p className="mt-1 text-xs text-danger-600">{form.errors.title}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Welcome message
                            </label>
                            <textarea
                                rows={2}
                                value={form.data.welcome_message}
                                onChange={(e) => form.setData('welcome_message', e.target.value)}
                                placeholder="Hi! How can we help you today?"
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                            />
                            {form.errors.welcome_message && (
                                <p className="mt-1 text-xs text-danger-600">{form.errors.welcome_message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Primary color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="h-9 w-12 cursor-pointer rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1"
                                    />
                                    <input
                                        type="text"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                                {form.errors.primary_color && (
                                    <p className="mt-1 text-xs text-danger-600">{form.errors.primary_color}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Position
                                </label>
                                <select
                                    value={form.data.position}
                                    onChange={(e) => form.setData('position', e.target.value)}
                                    className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                >
                                    <option value="bottom-right">Bottom right</option>
                                    <option value="bottom-left">Bottom left</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Assigned agent
                            </label>
                            <select
                                value={form.data.agent_id ?? ''}
                                onChange={(e) => form.setData('agent_id', e.target.value || '')}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                            >
                                <option value="">— None —</option>
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {form.errors.agent_id && (
                                <p className="mt-1 text-xs text-danger-600">{form.errors.agent_id}</p>
                            )}
                        </div>

                        <label className="flex items-center justify-between rounded-soft border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 cursor-pointer">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Enable widget
                            </span>
                            <button
                                type="button"
                                onClick={() => form.setData('enabled', !form.data.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    form.data.enabled ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-neutral-600'
                                }`}
                                role="switch"
                                aria-checked={form.data.enabled}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        form.data.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </label>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-soft bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                        >
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </button>
                    </form>

                    {/* RIGHT: Live preview + embed snippet */}
                    <div className="space-y-6">
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 shadow-soft">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                Live preview
                            </h2>

                            {/* Mock browser viewport */}
                            <div className="relative h-80 overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800">
                                <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 px-3 py-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                </div>

                                {/* Floating chat card */}
                                <div
                                    className={`absolute bottom-16 w-64 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl overflow-hidden ${
                                        alignRight ? 'right-4' : 'left-4'
                                    }`}
                                >
                                    <div
                                        className="flex items-center justify-between px-4 py-3 text-white"
                                        style={{ backgroundColor: form.data.primary_color }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bot className="h-4 w-4" />
                                            <span className="text-sm font-semibold truncate">
                                                {form.data.title || 'Chat with us'}
                                            </span>
                                        </div>
                                        <X className="h-4 w-4 opacity-80" />
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-neutral-100 dark:bg-neutral-700 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200">
                                            {form.data.welcome_message || 'Hi! How can we help you today?'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-700 px-3 py-2">
                                        <div className="flex-1 rounded-full bg-neutral-100 dark:bg-neutral-700 px-3 py-1.5 text-xs text-neutral-400">
                                            Type a message…
                                        </div>
                                        <span
                                            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                                            style={{ backgroundColor: form.data.primary_color }}
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                </div>

                                {/* Launcher bubble */}
                                <div
                                    className={`absolute bottom-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ${
                                        alignRight ? 'right-4' : 'left-4'
                                    }`}
                                    style={{ backgroundColor: form.data.primary_color }}
                                >
                                    <MessageCircle className="h-6 w-6" />
                                </div>

                                {!form.data.enabled && (
                                    <div className="absolute right-3 top-12 rounded-soft bg-neutral-900/70 px-2 py-1 text-[10px] font-medium text-white">
                                        Disabled — preview only
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Embed snippet */}
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 shadow-soft">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    Embed snippet
                                </h2>
                                <button
                                    type="button"
                                    onClick={copySnippet}
                                    className="inline-flex items-center gap-1.5 rounded-soft border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={snippet}
                                rows={2}
                                onFocus={(e) => e.target.select()}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-xs font-mono text-neutral-700 dark:text-neutral-300"
                            />
                            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                Paste this before the closing &lt;/body&gt; tag on your site.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
