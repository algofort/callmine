'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Head, router, useForm } from '@/lib/page-router';
import ClientLayout from '@/layouts/ClientLayout';
import { Inbox, Send, Clock } from 'lucide-react';

export default function Conversations({ conversations = [], thread = null }) {
    const form = useForm({ body: '' });
    const open = (id) => router.get(route('client.conversations.index'), { conversation: id }, { preserveState: true, replace: true });
    const send = (e) => { e.preventDefault(); if (!thread) return; form.post(route('client.conversations.send', thread.id), { preserveScroll: true, onSuccess: () => form.reset('body') }); };

    return (
        <ClientLayout title="Conversations">
            <Head title="Conversations" />
            <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-3">
                {/* List */}
                <div className="overflow-auto rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                    <div className="border-b border-neutral-100 dark:border-ink-800 px-4 py-3"><h2 className="font-display font-semibold text-neutral-900 dark:text-white">Inbox</h2></div>
                    {conversations.length === 0 ? (
                        <div className="px-4 py-16 text-center"><Inbox className="mx-auto mb-2 h-10 w-10 text-neutral-300" /><p className="text-sm text-neutral-500">No conversations yet.</p></div>
                    ) : conversations.map((c) => (
                        <button key={c.id} onClick={() => open(c.id)} className={`flex w-full items-center justify-between border-b border-neutral-100 dark:border-ink-800 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-ink-800/50 ${thread?.id === c.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                            <div className="min-w-0"><p className="truncate font-medium text-neutral-900 dark:text-white">{c.name}</p><p className="truncate font-mono text-xs text-neutral-400">{c.wa_phone}</p></div>
                            {c.unread_count > 0 && <span className="ml-2 rounded-full bg-brand-600 px-1.5 text-[10px] font-medium text-white">{c.unread_count}</span>}
                        </button>
                    ))}
                </div>

                {/* Thread */}
                <div className="flex flex-col overflow-hidden rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 lg:col-span-2">
                    {!thread ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">Select a conversation.</div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-ink-800 px-4 py-3">
                                <div><p className="font-display font-semibold text-neutral-900 dark:text-white">{thread.name}</p><p className="font-mono text-xs text-neutral-400">{thread.wa_phone}</p></div>
                                {!thread.window_open && <span className="inline-flex items-center gap-1 rounded-full bg-warm/20 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300"><Clock className="h-3 w-3" /> 24h window closed</span>}
                            </div>
                            <div className="flex-1 space-y-2 overflow-auto p-4">
                                {thread.messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-soft-lg px-3 py-2 text-sm ${m.direction === 'out' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-ink-800 text-neutral-800 dark:text-neutral-200'}`}>
                                            {m.body}
                                            <span className={`mt-0.5 block text-[10px] ${m.direction === 'out' ? 'text-brand-100' : 'text-neutral-400'}`}>{new Date(m.created_at).toLocaleTimeString()} {m.direction === 'out' ? `· ${m.status}` : ''}</span>
                                        </div>
                                    </div>
                                ))}
                                {thread.messages.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">No messages yet.</p>}
                            </div>
                            <form onSubmit={send} className="flex gap-2 border-t border-neutral-100 dark:border-ink-800 p-3">
                                <input className="flex-1 rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm" placeholder="Type a message…" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} />
                                <button type="submit" disabled={form.processing || !form.data.body} className="inline-flex items-center gap-1 rounded-soft bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"><Send className="h-4 w-4" /></button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
