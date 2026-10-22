'use client';

import { route } from '@/lib/route';
import { useRef, useState } from 'react';
import { Head, router } from '@/lib/page-router';
import axios from 'axios';
import ClientLayout from '@/layouts/ClientLayout';
import PageOverview from '@/components/PageOverview';
import StatCards from '@/components/StatCards';
import { showToast } from '@/components/FlashToast';
import { useTranslation } from 'react-i18next';
import { AudioLines, Play, Pause, Search } from 'lucide-react';

function VoiceCard({ voice }) {
    const [state, setState] = useState('idle'); // idle | loading | playing
    const audioRef = useRef(null);

    const stop = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setState('idle'); };

    const play = async () => {
        if (state === 'playing') return stop();
        setState('loading');
        try {
            let src = voice.preview_url;
            if (!src) {
                const { data } = await axios.post(route('client.voices.preview', voice.id));
                src = data.url || data.data;
            }
            if (!src) { setState('idle'); return; }
            const audio = new Audio(src);
            audioRef.current = audio;
            audio.onended = () => setState('idle');
            await audio.play();
            setState('playing');
        } catch (e) {
            setState('idle');
            showToast(e?.response?.data?.message || 'Preview unavailable for this voice.', 'error');
        }
    };

    const tags = [voice.gender, voice.age_group, voice.accent, voice.best_for].filter(Boolean);

    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"><AudioLines className="h-4 w-4" /></span>
                    <div className="min-w-0">
                        <p className="truncate font-display font-semibold text-neutral-900 dark:text-white">{voice.name}</p>
                        {voice.tone && <p className="truncate text-xs text-neutral-500">{voice.tone}</p>}
                    </div>
                </div>
                <button onClick={play} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${state === 'playing' ? 'bg-signal-500 text-white animate-pulse-signal' : 'bg-brand-600 text-white hover:bg-brand-500'}`} aria-label="Preview">
                    {state === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
            </div>
            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((tag) => <span key={tag} className="rounded-full bg-neutral-100 dark:bg-ink-800 px-2 py-0.5 text-[11px] capitalize text-neutral-600 dark:text-neutral-300">{String(tag).replace(/_/g, ' ')}</span>)}
                </div>
            )}
        </div>
    );
}

export default function VoicesIndex({ voices, stats = [], filters = {}, filterOptions = {} }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');

    const apply = (extra = {}) => router.get(route('client.voices.index'), { search, ...filters, ...extra }, { preserveState: true, replace: true });

    return (
        <ClientLayout title={t('nav.voices') !== 'nav.voices' ? t('nav.voices') : 'Voices'}>
            <Head title="Voices" />
            <div className="space-y-5">
                <div>
                    <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Voice library</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Browse and preview ElevenLabs voices for your agents.</p>
                </div>

                <PageOverview feature="voices" />

                <StatCards items={stats} />

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="relative flex-1 min-w-[200px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search voices…" className="w-full rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm" />
                    </form>
                    {['gender', 'age_group', 'best_for'].map((f) => (
                        <select key={f} value={filters[f] || ''} onChange={(e) => apply({ [f]: e.target.value })} className="rounded-soft border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 px-3 text-sm capitalize">
                            <option value="">{f.replace('_', ' ')}</option>
                            {(filterOptions[f] || []).map((opt) => <option key={opt} value={opt}>{String(opt).replace(/_/g, ' ')}</option>)}
                        </select>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {voices.data.map((v) => <VoiceCard key={v.id} voice={v} />)}
                </div>
                {voices.data.length === 0 && <p className="py-10 text-center text-sm text-neutral-500">No voices found. Ask your administrator to sync the ElevenLabs voice library.</p>}
            </div>
        </ClientLayout>
    );
}
