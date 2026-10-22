import 'server-only';

import { plain } from '@/lib/serialize';

/**
 * Reproduces Illuminate\Pagination\LengthAwarePaginator's JSON shape, including
 * the `links` array with its "&laquo; Previous" / "Next &raquo;" labels, so the
 * ported <Pagination /> component works untouched.
 */
export function paginator({ items, total, perPage, page, path, query = {}, transform = null }) {
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page), lastPage);
    const from = total === 0 ? null : (current - 1) * perPage + 1;
    const to = total === 0 ? null : Math.min(current * perPage, total);

    const url = (p) => {
        if (p === null) return null;
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null || v === '') continue;
            qs.set(k, String(v));
        }
        qs.set('page', String(p));
        return `${path}?${qs.toString()}`;
    };

    const data = transform ? items.map(transform) : items;

    return plain({
        current_page: current,
        data,
        first_page_url: url(1),
        from,
        last_page: lastPage,
        last_page_url: url(lastPage),
        links: buildLinks(current, lastPage, url),
        next_page_url: current < lastPage ? url(current + 1) : null,
        path,
        per_page: perPage,
        prev_page_url: current > 1 ? url(current - 1) : null,
        to,
        total,
    });
}

/** Show three page links on each side of the current page. */
function buildLinks(current, lastPage, url) {
    const links = [
        { url: current > 1 ? url(current - 1) : null, label: '&laquo; Previous', active: false },
    ];

    const window = pageWindow(current, lastPage, 3);
    for (const page of window) {
        if (page === '...') links.push({ url: null, label: '...', active: false });
        else links.push({ url: url(page), label: String(page), active: page === current });
    }

    links.push({
        url: current < lastPage ? url(current + 1) : null,
        label: 'Next &raquo;',
        active: false,
    });

    return links;
}

function pageWindow(current, lastPage, onEachSide) {
    if (lastPage <= onEachSide * 2 + 6) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    const pages = [];
    if (current <= onEachSide * 2 + 2) {
        for (let i = 1; i <= onEachSide * 2 + 3; i++) pages.push(i);
        pages.push('...', lastPage - 1, lastPage);
    } else if (current >= lastPage - (onEachSide * 2 + 1)) {
        pages.push(1, 2, '...');
        for (let i = lastPage - (onEachSide * 2 + 2); i <= lastPage; i++) pages.push(i);
    } else {
        pages.push(1, 2, '...');
        for (let i = current - onEachSide; i <= current + onEachSide; i++) pages.push(i);
        pages.push('...', lastPage - 1, lastPage);
    }
    return pages;
}

/** Runs a Prisma count+findMany pair and wraps the result. `->paginate($perPage)`. */
export async function paginate(model, { where, orderBy, include, select, perPage = 20, page = 1, path, query = {}, transform = null }) {
    const current = Math.max(1, parseInt(page, 10) || 1);

    const [total, items] = await Promise.all([
        model.count({ where }),
        model.findMany({
            where,
            orderBy,
            ...(include ? { include } : {}),
            ...(select ? { select } : {}),
            skip: (current - 1) * perPage,
            take: perPage,
        }),
    ]);

    return paginator({ items, total, perPage, page: current, path, query, transform });
}
