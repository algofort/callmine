'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page numbers + ellipsis model for client-side tables (matches Prev / 1 2 … 7 / Next pattern).
 */
export function getPaginationItems(current, total) {
    if (total < 1) {
        return [];
    }
    if (total === 1) {
        return [1];
    }
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
        return [1, 2, 3, 4, 5, 'more', total];
    }
    if (current >= total - 3) {
        return [1, 'more', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, 'more', current - 1, current, current + 1, 'more', total];
}

const navBtn =
    'inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-soft border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

const pageBtnBase =
    'inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-soft text-sm transition';

const pageBtnInactive =
    `${pageBtnBase} border border-neutral-200 bg-white font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800`;

/** Active page: solid brand background (no conflicting border/bg from inactive) */
const pageBtnActive =
    `${pageBtnBase} border border-brand-600 bg-brand-600 font-semibold text-white shadow-md ring-1 ring-inset ring-white/20 hover:border-brand-700 hover:bg-brand-700 dark:border-brand-500 dark:bg-brand-500 dark:hover:border-brand-400 dark:hover:bg-brand-400`;

/**
 * Numbered pagination: Previous, page buttons (with …), Next. Right-aligned in parent.
 */
export default function TablePagePagination({ currentPage, lastPage, onPageChange, className = '' }) {
    const items = useMemo(() => getPaginationItems(currentPage, lastPage), [currentPage, lastPage]);

    if (lastPage < 1) {
        return null;
    }

    return (
        <div
            className={['flex flex-wrap items-center justify-end gap-1', className].filter(Boolean).join(' ')}
            role="navigation"
            aria-label="Pagination"
        >
            <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className={navBtn}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            {items.map((item, i) => {
                if (item === 'more') {
                    return (
                        <span
                            key={`ellipsis-${i}`}
                            className="inline-flex min-w-9 select-none items-center justify-center px-0.5 text-sm font-medium text-brand-600 dark:text-brand-400"
                            aria-hidden
                        >
                            …
                        </span>
                    );
                }
                const isActive = item === currentPage;
                return (
                    <button
                        key={`page-${item}-${i}`}
                        type="button"
                        onClick={() => onPageChange(item)}
                        className={isActive ? pageBtnActive : pageBtnInactive}
                        aria-label={`Page ${item}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {item}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => onPageChange(currentPage + 1)}
                className={navBtn}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
        </div>
    );
}
