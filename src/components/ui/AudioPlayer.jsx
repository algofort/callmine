'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader2 } from 'lucide-react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmtTime(s) {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * Custom audio player — play/pause, scrubber, playback speed, volume, download.
 * @param {string} src — Audio URL
 * @param {string} [filename] — Download filename
 * @param {boolean} [showDownload] — Render download button (default: true)
 */
export default function AudioPlayer({ src, filename = 'recording.mp3', showDownload = true, className = '' }) {
    const audioRef = useRef(null);
    const trackRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [scrubbing, setScrubbing] = useState(false);
    const [volumeOpen, setVolumeOpen] = useState(false);
    const [error, setError] = useState(false);

    const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

    // Reset when the source changes
    useEffect(() => {
        setReady(false);
        setPlaying(false);
        setCurrent(0);
        setDuration(0);
        setError(false);
    }, [src]);

    const seekToClientX = useCallback((clientX) => {
        const el = trackRef.current;
        const audio = audioRef.current;
        if (!el || !audio || !Number.isFinite(duration) || duration <= 0) return;
        const rect = el.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const time = ratio * duration;
        audio.currentTime = time;
        setCurrent(time);
    }, [duration]);

    // Drag-to-scrub — listeners live on window so the pointer can leave the track
    useEffect(() => {
        if (!scrubbing) return;
        const move = (e) => seekToClientX(e.touches ? e.touches[0].clientX : e.clientX);
        const up = () => setScrubbing(false);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [scrubbing, seekToClientX]);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio || error) return;
        if (audio.paused) audio.play().catch(() => setError(true));
        else audio.pause();
    };

    const cycleSpeed = () => {
        const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
        setSpeed(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const next = !muted;
        audio.muted = next;
        setMuted(next);
    };

    const changeVolume = (v) => {
        const audio = audioRef.current;
        setVolume(v);
        if (!audio) return;
        audio.volume = v;
        audio.muted = v === 0;
        setMuted(v === 0);
    };

    const onKeyDown = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(duration, audio.currentTime + 5); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
        else if (e.key === 'Home') { e.preventDefault(); audio.currentTime = 0; }
        else if (e.key === 'End') { e.preventDefault(); audio.currentTime = duration; }
    };

    if (!src) return null;

    return (
        <div className={`rounded-soft-lg border border-neutral-200 dark:border-ink-700 bg-white dark:bg-ink-800/50 px-3 py-2.5 ${className}`}>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={(e) => { setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0); setReady(true); }}
                onDurationChange={(e) => { if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
                onTimeUpdate={(e) => { if (!scrubbing) setCurrent(e.currentTarget.currentTime); }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); setCurrent(0); }}
                onError={() => { setError(true); setReady(false); }}
                className="hidden"
            />

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggle}
                    disabled={error}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {error ? <VolumeX className="h-4 w-4" />
                        : !ready ? <Loader2 className="h-4 w-4 animate-spin" />
                        : playing ? <Pause className="h-4 w-4 fill-current" />
                        : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>

                <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">{fmtTime(current)}</span>

                <div
                    ref={trackRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(current)}
                    aria-valuetext={`${fmtTime(current)} of ${fmtTime(duration)}`}
                    onKeyDown={onKeyDown}
                    onMouseDown={(e) => { setScrubbing(true); seekToClientX(e.clientX); }}
                    onTouchStart={(e) => { setScrubbing(true); seekToClientX(e.touches[0].clientX); }}
                    className="group relative h-6 flex-1 cursor-pointer select-none focus:outline-none"
                >
                    <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-ink-700">
                        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-75" style={{ width: `${pct}%` }} />
                    </div>
                    <div
                        className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600 shadow-soft transition-opacity ${scrubbing || playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'}`}
                        style={{ left: `${pct}%` }}
                    />
                </div>

                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">{fmtTime(duration)}</span>

                <button
                    type="button"
                    onClick={cycleSpeed}
                    aria-label={`Playback speed ${speed}x`}
                    className="shrink-0 rounded-soft px-1.5 py-1 font-mono text-xs font-medium tabular-nums text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-200"
                >
                    {speed}×
                </button>

                <div
                    className="relative shrink-0"
                    onMouseEnter={() => setVolumeOpen(true)}
                    onMouseLeave={() => setVolumeOpen(false)}
                >
                    <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={muted ? 'Unmute' : 'Mute'}
                        className="rounded-soft p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-200"
                    >
                        {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    {volumeOpen && (
                        <div className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-soft border border-neutral-200 bg-white p-2 shadow-soft-md dark:border-ink-700 dark:bg-ink-900">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={muted ? 0 : volume}
                                onChange={(e) => changeVolume(Number(e.target.value))}
                                aria-label="Volume"
                                className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-brand-600 dark:bg-ink-700"
                            />
                        </div>
                    )}
                </div>

                {showDownload && (
                    <a
                        href={src}
                        download={filename}
                        aria-label="Download recording"
                        className="shrink-0 rounded-soft p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-200"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                )}
            </div>

            {error && <p className="mt-1.5 pl-1 text-xs text-hot">Recording could not be loaded.</p>}
        </div>
    );
}
