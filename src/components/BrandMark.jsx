'use client';

const PALETTES = {
    light: { irisA: '#8a67f2', irisB: '#5a28d6', signal: '#06b88c' },
    dark: { irisA: '#a890f7', irisB: '#6d3fea', signal: '#16d9a8' },
};

/**
 * CallMineAI "Pulse C" mark — open C ring (iris gradient) with an asymmetric
 * voice-pulse (signal teal) exiting through the aperture.
 *
 * @param {{ variant?: 'light' | 'dark', mono?: string, className?: string }} props
 *   variant — palette tuned for light or dark backgrounds.
 *   mono — single color override (e.g. 'currentColor') for monochrome contexts.
 */
export default function BrandMark({ variant = 'light', mono = null, className, ...props }) {
    const p = PALETTES[variant] || PALETTES.light;
    const gradId = `cmai-iris-${variant}`;
    return (
        <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="true"
            className={className}
            {...props}
        >
            {!mono && (
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={p.irisA} />
                        <stop offset="1" stopColor={p.irisB} />
                    </linearGradient>
                </defs>
            )}
            <g fill="none" strokeLinecap="round">
                <path d="M37.023 34.927A17 17 0 1 1 37.023 13.073" stroke={mono || `url(#${gradId})`} strokeWidth="7" />
                <path d="M18 21v6M24 16.5v15M30 19v10" stroke={mono || p.signal} strokeWidth="4.5" />
            </g>
        </svg>
    );
}

/**
 * Brand name with the trailing "AI" set in signal teal. Falls back to plain
 * text for custom (admin-configured) names that don't end in "AI".
 */
export function BrandName({ brand = 'CallMineAI' }) {
    const match = /^(.*?)(AI)$/.exec(brand.trim());
    if (!match) return brand;
    return (
        <>
            {match[1]}
            <span className="text-signal-500 dark:text-signal-400">{match[2]}</span>
        </>
    );
}
