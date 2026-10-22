'use client';

import { Fragment, createContext, useContext, useState, useRef, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { Link } from '@/lib/page-router';

const DropdownContext = createContext();

export default function Dropdown({ children }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    // Close on click/tap outside or Escape. A document listener is used instead of a
    // fixed-overlay backdrop because the topbar's `backdrop-blur` (backdrop-filter)
    // changes the containing block for `position: fixed`, which would clip a full-screen
    // overlay to the topbar and break outside-click everywhere else on the page.
    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div className="relative" ref={rootRef}>{children}</div>
        </DropdownContext.Provider>
    );
}

function Trigger({ children }) {
    const { open, setOpen } = useContext(DropdownContext);
    return <div onClick={() => setOpen(!open)}>{children}</div>;
}

function Content({ align = 'right', width = '48', children }) {
    const { open, setOpen } = useContext(DropdownContext);
    const alignClass = align === 'left'
        ? 'left-0 rtl:right-0 rtl:left-auto'
        : 'right-0 rtl:left-0 rtl:right-auto';
    const widthClass = width === '48' ? 'w-48' : width === '56' ? 'w-56' : 'w-64';

    return (
        <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <div
                className={`absolute z-50 mt-2 ${alignClass} ${widthClass} rounded-soft-lg border border-soft border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-1 shadow-soft-lg dark:shadow-none`}
                onClick={() => setOpen(false)}
            >
                {children}
            </div>
        </Transition>
    );
}

function Item({ as = 'button', className = '', children, ...props }) {
    const base = 'block w-full px-4 py-2.5 text-left rtl:text-right text-sm text-neutral-700 transition-colors duration-200 ease-out hover:bg-brand-50 hover:text-brand-900 dark:text-neutral-300 dark:hover:bg-brand-900/25 dark:hover:text-brand-100 first:rounded-t-soft last:rounded-b-soft';
    if (as === 'link') {
        return (
            <Link className={`${base} ${className}`} {...props}>
                {children}
            </Link>
        );
    }
    return (
        <button type="button" className={`${base} ${className}`} {...props}>
            {children}
        </button>
    );
}

function Divider() {
    return <div className="my-1 border-t border-soft border-gray-200 dark:border-neutral-700" />;
}

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Item = Item;
Dropdown.Divider = Divider;
