'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

const btnBase =
    'relative flex w-full cursor-default items-center justify-between gap-2 rounded-soft border border-soft border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-900 shadow-inner transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100';

const btnOpen = 'border-brand-500 dark:border-brand-500';

const panelBase =
    'z-[100] max-h-60 overflow-auto rounded-soft-lg border border-neutral-200 bg-white py-1 shadow-soft-lg outline-none [--anchor-gap:4px] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none';

const optionBase =
    'relative cursor-pointer select-none text-sm text-neutral-900 transition-colors duration-100 dark:text-neutral-100';

/** Hover, keyboard focus, and selected all use the same pale blue surface (brand-50). */
function listboxOptionClassName({ focus, selected: sel }) {
    return [
        optionBase,
        'px-3 py-2.5',
        'hover:bg-brand-50 dark:hover:bg-brand-900/30',
        sel
            ? 'bg-brand-50 font-medium text-brand-900 dark:bg-brand-900/25 dark:text-brand-100'
            : focus
              ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/35 dark:text-brand-100'
              : '',
    ]
        .filter(Boolean)
        .join(' ');
}

/**
 * Theme-styled dropdown (Headless UI Listbox). Matches Input/Select surface; no native OS menu.
 * @param {'default' | 'brand' | 'teal'} [tone] — `brand` / `teal` kept for API compatibility; styling matches default (pale blue hover + active + selected).
 */
export default function ThemedSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    className = '',
    disabled = false,
    id,
    name,
    form,
    /** @deprecated Kept for call sites; hover / focus / selected all use the same `brand-50` row. */
    tone: _tone = 'default',
}) {
    const selected = options.find((o) => o.value === value);
    const display = selected?.label ?? placeholder;

    return (
        <div className={['relative w-full', className].filter(Boolean).join(' ')}>
            <Listbox value={value} onChange={onChange} disabled={disabled} name={name} form={form}>
                {({ open }) => (
                    <>
                        <ListboxButton
                            id={id}
                            className={[btnBase, open ? btnOpen : ''].filter(Boolean).join(' ')}
                            disabled={disabled}
                        >
                            <span className="block min-w-0 flex-1 truncate">{display}</span>
                            <ChevronDown
                                className={[
                                    'h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 dark:text-neutral-500',
                                    open ? 'rotate-180' : '',
                                ].join(' ')}
                                aria-hidden
                            />
                        </ListboxButton>
                        <ListboxOptions
                            anchor="bottom start"
                            transition
                            modal={false}
                            className={[panelBase, 'w-[var(--anchor-width)]'].join(' ')}
                        >
                            {options.map((opt) => (
                                <ListboxOption
                                    key={String(opt.value)}
                                    value={opt.value}
                                    className={listboxOptionClassName}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="min-w-0 truncate">{opt.label}</span>
                                        {value === opt.value ? (
                                            <Check
                                                className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400"
                                                strokeWidth={2}
                                                aria-hidden
                                            />
                                        ) : (
                                            <span className="h-4 w-4 shrink-0" aria-hidden />
                                        )}
                                    </span>
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </>
                )}
            </Listbox>
        </div>
    );
}
