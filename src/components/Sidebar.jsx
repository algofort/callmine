'use client';

import { route } from '@/lib/route';
import { Link, usePage } from '@/lib/page-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

function itemIsActive(item) {
    if (typeof item.active === 'function') return item.active();
    if (item.route) return route().current(item.route);
    return false;
}

const ACTIVE = 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-950/40';
const INACTIVE = 'text-ink-300 hover:bg-white/[0.06] hover:text-white';

// Vivid per-item icon colors (inline style avoids Tailwind purge of dynamic classes).
const ICON_PALETTE = ['#8a67f2', '#16d9a8', '#4fb0ff', '#fb5e5e', '#ffb23e', '#34d399', '#6366f1', '#ec4899', '#06b6d4', '#f97316', '#a3e635', '#d946ef', '#f43f5e', '#14b8a6'];
function iconColor(key) {
    const s = String(key ?? '');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return ICON_PALETTE[h % ICON_PALETTE.length];
}

function NavGroup({ label, items, onClose, icon, variant = 'default', alwaysActive = false, suppressHeader = false, groupKey, manualOpenKey, setManualOpenKey }) {
    const isAccent = variant === 'accent';
    const hasActiveChild = items.some(itemIsActive);
    const open = alwaysActive || hasActiveChild || manualOpenKey === groupKey;

    const headerClassName = 'flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 select-none text-ink-400 hover:text-ink-200';

    const headerInner = (
        <>
            <span className="flex min-w-0 flex-1 items-center gap-2">
                {icon && <span className="shrink-0 text-ink-400">{icon}</span>}
                <span className="truncate">{label}</span>
            </span>
            {!alwaysActive && <ChevronDown className={['h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-ink-500', open ? 'rotate-0' : '-rotate-90'].join(' ')} />}
        </>
    );

    return (
        <div className="mb-1">
            {!suppressHeader && (alwaysActive ? (
                <div className={headerClassName}>{headerInner}</div>
            ) : (
                <button type="button" onClick={() => { if (hasActiveChild) return; setManualOpenKey((c) => (c === groupKey ? null : groupKey)); }} className={[headerClassName, 'w-full text-left cursor-pointer'].join(' ')} aria-expanded={open} aria-label={label}>
                    {headerInner}
                </button>
            ))}

            {open && (
                <div className={[suppressHeader ? 'space-y-0.5' : 'mt-1 space-y-0.5', isAccent ? 'ml-2 border-l border-white/10 pl-2.5' : ''].join(' ')}>
                    {items.map((item, i) => {
                        const isActive = itemIsActive(item);
                        return (
                            <Link
                                key={item.key ?? item.route ?? item.href ?? i}
                                href={item.href ?? (item.route ? route(item.route) : '#')}
                                onClick={onClose}
                                className={['group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition duration-150', isActive ? ACTIVE : INACTIVE].join(' ')}
                            >
                                {isActive && <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-300" />}
                                {item.icon && <span className="shrink-0 transition" style={isActive ? undefined : { color: iconColor(item.key ?? item.route ?? item.href ?? item.label) }}>{item.icon}</span>}
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ navItems = [], navGroups = [], open = false, onClose, footer, title, logo }) {
    const { t } = useTranslation();
    const { url } = usePage();
    const [manualOpenKey, setManualOpenKey] = useState(null);
    const menuTitle = title ?? t('sidebar.menu');

    useEffect(() => { setManualOpenKey(null); }, [url]);

    const content = (
        <aside className="sidebar flex h-full w-64 flex-col bg-gradient-to-b from-ink-950 to-ink-900 border-r border-white/5">
            {/* Brand */}
            <div className="flex h-16 shrink-0 items-center border-b border-white/5 px-4">
                {logo || <span className="font-display font-semibold text-white">{menuTitle}</span>}
            </div>

            <nav className="sidebar-scroll sidebar-fade flex-1 overflow-y-auto px-3 py-3">
                {navGroups.length > 0 && navGroups.map((group, gi) => {
                    const groupKey = `nav-g-${gi}`;
                    return (
                        <NavGroup key={groupKey} groupKey={groupKey} manualOpenKey={manualOpenKey} setManualOpenKey={setManualOpenKey} label={group.label} items={group.items ?? []} onClose={onClose} icon={group.icon} variant={group.variant ?? 'default'} alwaysActive={group.alwaysActive === true} suppressHeader={group.suppressHeader === true} />
                    );
                })}

                {navGroups.length === 0 && navItems.map((item, i) => {
                    if (item.type === 'divider') return <hr key={`div-${i}`} className="my-2 border-white/5" />;
                    const isActive = typeof item.active === 'function' ? item.active() : item.active ?? (item.route && route().current(item.route));
                    return (
                        <Link key={item.key ?? item.route ?? item.href ?? i} href={item.href ?? (item.route ? route(item.route) : '#')} onClick={onClose} className={['group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition duration-150 mb-0.5', isActive ? ACTIVE : INACTIVE].join(' ')}>
                            {isActive && <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-300" />}
                            {item.icon && <span className="shrink-0" style={isActive ? undefined : { color: iconColor(item.key ?? item.route ?? item.href ?? item.label) }}>{item.icon}</span>}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {footer && <div className="shrink-0 border-t border-white/5 p-3">{footer}</div>}
        </aside>
    );

    return (
        <>
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:left-0 rtl:lg:left-auto rtl:lg:right-0">{content}</div>

            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
                    <div className="fixed inset-y-0 left-0 w-64 shadow-2xl rtl:left-auto rtl:right-0">{content}</div>
                </div>
            )}
        </>
    );
}
