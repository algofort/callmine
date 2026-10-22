'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';

function humanSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

/**
 * Branded file picker with a chosen-file chip + remove button.
 * Controlled: pass `value` (File|null) and `onChange(file|null)`.
 */
export default function FileInput({ value = null, onChange, accept, hint, disabled = false, id }) {
    const ref = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const isImage = value && /image\//.test(value.type || '');

    const pick = (file) => onChange?.(file ?? null);
    const clear = (e) => { e?.stopPropagation(); if (ref.current) ref.current.value = ''; onChange?.(null); };
    const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (disabled) return; const f = e.dataTransfer.files?.[0]; if (f) pick(f); };

    if (value) {
        const Icon = isImage ? ImageIcon : FileText;
        return (
            <div className="flex items-center gap-3 rounded-soft-lg border border-brand-200 dark:border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/10 px-3 py-2.5">
                {isImage ? (
                    <img src={URL.createObjectURL(value)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"><Icon className="h-4 w-4" /></span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{value.name}</p>
                    <p className="text-xs text-neutral-500">{humanSize(value.size)}</p>
                </div>
                <button type="button" onClick={() => ref.current?.click()} className="shrink-0 rounded-soft px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/20">Change</button>
                <button type="button" onClick={clear} aria-label="Remove file" className="shrink-0 rounded-soft p-1.5 text-neutral-400 hover:bg-danger/10 hover:text-danger transition"><X className="h-4 w-4" /></button>
                <input ref={ref} id={id} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </div>
        );
    }

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => ref.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-soft-lg border border-dashed px-4 py-6 text-center transition disabled:opacity-50 ${dragOver ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10' : 'border-neutral-300 dark:border-ink-700 hover:border-brand-300 hover:bg-neutral-50 dark:hover:bg-ink-800/50'}`}
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"><UploadCloud className="h-5 w-5" /></span>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Choose a file <span className="text-neutral-400">or drag & drop</span></span>
            {hint && <span className="text-xs text-neutral-400">{hint}</span>}
            <input ref={ref} id={id} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </button>
    );
}
