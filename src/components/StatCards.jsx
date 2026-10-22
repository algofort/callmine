'use client';

import {
    Users, UserRound, Phone, PhoneCall, Megaphone, Bot, BookOpen, KeyRound, ShieldCheck,
    FileText, Mail, MessageSquare, Bell, CreditCard, Banknote, Coins, DollarSign, Layers,
    Lock, TicketPercent, Gift, ListChecks, Activity, CheckCircle2, Clock, TrendingUp, Target,
    AudioLines, Building2, Globe, RefreshCw, Plug, Database, Hash, Network, Share2, Zap,
} from 'lucide-react';

// Backend passes a lightweight icon string; resolve it here.
const ICONS = {
    users: Users, user: UserRound, phone: Phone, 'phone-call': PhoneCall, megaphone: Megaphone,
    bot: Bot, book: BookOpen, key: KeyRound, shield: ShieldCheck, file: FileText, mail: Mail,
    message: MessageSquare, bell: Bell, 'credit-card': CreditCard, banknote: Banknote, coins: Coins,
    dollar: DollarSign, layers: Layers, lock: Lock, ticket: TicketPercent, gift: Gift, list: ListChecks,
    activity: Activity, check: CheckCircle2, clock: Clock, 'trending-up': TrendingUp, target: Target,
    audio: AudioLines, building: Building2, globe: Globe, refresh: RefreshCw, plug: Plug,
    database: Database, hash: Hash, network: Network, share: Share2, zap: Zap,
};

const ACCENTS = {
    brand: { tile: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', bar: 'from-brand-500 to-brand-300', glow: 'bg-brand-500/25' },
    signal: { tile: 'bg-signal-500/15 text-signal-600 dark:text-signal-300', bar: 'from-signal-500 to-signal-300', glow: 'bg-signal-500/25' },
    warm: { tile: 'bg-warm/15 text-amber-600 dark:text-amber-300', bar: 'from-warm to-amber-300', glow: 'bg-warm/25' },
    cold: { tile: 'bg-cold/15 text-cold', bar: 'from-cold to-sky-300', glow: 'bg-cold/25' },
    danger: { tile: 'bg-danger/15 text-danger', bar: 'from-hot to-rose-300', glow: 'bg-hot/25' },
};

const GRID = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

function Card({ label, value, icon, accent = 'brand', hint }) {
    const a = ACCENTS[accent] || ACCENTS.brand;
    const Icon = icon && ICONS[icon];
    return (
        <div className="group relative overflow-hidden rounded-soft-lg border border-neutral-200 bg-white p-4 shadow-soft transition duration-250 hover:shadow-soft-lg dark:border-ink-800 dark:bg-ink-900">
            <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
            <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition duration-250 group-hover:opacity-100 ${a.glow}`} />
            <div className="relative flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</p>
                {Icon && <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${a.tile}`}><Icon className="h-4 w-4" /></span>}
            </div>
            <p className="relative mt-3 font-display text-[26px] font-bold leading-none tabular-nums text-neutral-900 dark:text-white">{value}</p>
            {hint && <p className="relative mt-1.5 text-xs text-neutral-500">{hint}</p>}
        </div>
    );
}

/**
 * Row of summary stat cards for a feature page.
 * `items`: [{ label, value, icon?, accent?, hint? }] — usually passed from the
 * controller as a `stats` prop. Renders nothing if empty.
 */
export default function StatCards({ items = [], columns, className = '' }) {
    if (!items.length) return null;
    const n = Math.min(columns || items.length, 6);
    return (
        <div className={`grid gap-3 ${GRID[n] || GRID[4]} ${className}`}>
            {items.map((s, i) => <Card key={i} {...s} />)}
        </div>
    );
}
