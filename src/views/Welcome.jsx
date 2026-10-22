'use client';

import { route } from '@/lib/route';
import { useState } from 'react';
import { Link, usePage } from '@/lib/page-router';
import MarketingLayout from '@/layouts/MarketingLayout';
import { Reveal, Eyebrow, WaveBars, SectionHead, Counter } from '@/components/marketing/ui';
import { FAQ_FLAT } from '@/components/marketing/faqData';
import {
    PhoneCall, ArrowRight, Play, Bot, Megaphone, Target, Check, Star, Minus,
    AudioLines, Languages, FileAudio, Workflow, Cable, ShieldCheck, MessageSquare,
    Gift, ClipboardList, Layers, Users, Plug, KeyRound, BarChart3, Server, Lock,
    Sparkles, Building2, Headphones, Briefcase, Home, Search, Code2, Gauge,
} from 'lucide-react';

/* Shared surface + accent tokens (light + dark) */
const CARD = 'mk-card-lift rounded-2xl border border-neutral-200/80 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-ink-900/60 dark:backdrop-blur-none';
const ACC = {
    brand: { tile: 'bg-brand-500/12 text-brand-600 ring-brand-500/20 dark:text-brand-300', dot: 'bg-brand-500', text: 'text-brand-600 dark:text-brand-300' },
    signal: { tile: 'bg-signal-500/12 text-signal-600 ring-signal-500/20 dark:text-signal-300', dot: 'bg-signal-500', text: 'text-signal-600 dark:text-signal-300' },
    warm: { tile: 'bg-warm/15 text-amber-600 ring-warm/25 dark:text-amber-300', dot: 'bg-warm', text: 'text-amber-600 dark:text-amber-300' },
    cold: { tile: 'bg-cold/12 text-cold ring-cold/25', dot: 'bg-cold', text: 'text-cold' },
};

/* ---------- hero signature (kept dark: product panel) ---------- */
function CallConsole() {
    const turns = [
        { who: 'agent', text: 'Hi Marcus — this is Ava from Northwind. Do you have 30 seconds?' },
        { who: 'caller', text: 'Sure, what is this about?' },
        { who: 'agent', text: 'You looked at our pricing last week. Are you evaluating for a team?' },
    ];
    return (
        <div className="relative">
            <div className="pointer-events-none absolute -inset-8 -z-10" aria-hidden="true">
                <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-brand-500/25 blur-[90px]" />
                <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-signal-500/20 blur-[90px]" />
            </div>
            <div className="floaty absolute -left-4 top-6 z-20 hidden rounded-xl border border-white/10 bg-ink-900 px-3 py-2 shadow-2xl backdrop-blur sm:block">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Sentiment</p>
                <p className="text-sm font-semibold text-signal-400">Positive · 0.86</p>
            </div>
            <div className="floaty d2 absolute -right-4 bottom-16 z-20 hidden rounded-xl border border-white/10 bg-ink-900 px-3 py-2 shadow-2xl backdrop-blur sm:block">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Outcome</p>
                <p className="text-sm font-semibold text-white">+1 qualified lead</p>
            </div>
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-ink-900 shadow-[0_40px_120px_-30px_rgba(109,63,234,0.5)]">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
                <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/40"><Bot className="h-5 w-5" /></span>
                            <div>
                                <p className="text-sm font-semibold text-white">Ava · Sales Qualifier</p>
                                <p className="font-mono text-[11px] text-neutral-500">ElevenLabs + Twilio · EN-US</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-500/30 bg-signal-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-signal-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-pulse-signal" /> Live · 00:47
                        </span>
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/5 bg-ink-950/60 p-4"><WaveBars count={48} h="h-14" /></div>
                    <div className="mt-5 space-y-3">
                        {turns.map((t, i) => (
                            <div key={i} className={`flex ${t.who === 'agent' ? '' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${t.who === 'agent' ? 'rounded-tl-sm bg-brand-500/12 text-brand-50 ring-1 ring-brand-400/20' : 'rounded-tr-sm bg-white/[0.06] text-neutral-200 ring-1 ring-white/10'}`}>
                                    <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-widest text-neutral-500">{t.who === 'agent' ? 'Ava' : 'Marcus'}</span>
                                    {t.text}
                                    {i === turns.length - 1 && <span className="caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-signal-400" />}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/5 bg-ink-950/60 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Lead score</p>
                            <p className="font-mono text-xs font-semibold text-warm">WARM · 72</p>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                            <div className="sweep h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg,#4fb0ff,#ffb23e 70%,#fb5e5e)' }} />
                            <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-950 bg-white shadow" style={{ left: '72%' }} />
                        </div>
                        <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-600"><span className="text-cold">Cold</span><span className="text-warm">Warm</span><span className="text-hot">Hot</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PROVIDERS = ['Twilio', 'Plivo', 'ElevenLabs', 'OpenAI', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zapier'];

const STEPS = [
    { n: '01', icon: Bot, title: 'Design your agent', text: 'Pick a voice, set the goal, personality and knowledge. Draft the opening line and let it improvise the rest — or start from a prompt template.', chips: ['Voice', 'Goal', 'Knowledge'] },
    { n: '02', icon: Megaphone, title: 'Launch a campaign', text: 'Upload contacts, choose an engine and schedule. The concurrency-aware dialer places calls and handles retries and caps automatically.', chips: ['CSV import', 'Schedule', 'Auto-retry'] },
    { n: '03', icon: Target, title: 'Harvest qualified leads', text: 'Every call is recorded, transcribed and scored Hot / Warm / Cold, then routed by your flows and pushed straight to your CRM.', chips: ['Scored', 'Transcribed', 'CRM sync'] },
];

const CORE = [
    { span: 'lg:col-span-2', icon: Target, title: 'Real-time lead scoring', text: 'Every conversation is graded Hot, Warm or Cold as it happens — with sentiment analysis and an AI summary — so your team calls the right people first.', viz: (
        <div className="mt-5 flex flex-wrap gap-2">
            {[['Hot', 'text-hot', 'bg-hot/10 ring-hot/25', '38'], ['Warm', 'text-warm', 'bg-warm/10 ring-warm/25', '124'], ['Cold', 'text-cold', 'bg-cold/10 ring-cold/25', '291']].map(([l, c, bg, n]) => (
                <span key={l} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${bg} ${c}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{l}<span className="font-mono text-xs opacity-70">{n}</span></span>
            ))}
        </div>) },
    { span: '', icon: AudioLines, title: 'Natural voices', text: 'Ultra-realistic voices with tone, accent and emotion via ElevenLabs and OpenAI.', viz: <div className="mt-5"><WaveBars count={26} h="h-9" /></div> },
    { span: '', icon: Languages, title: '29 languages', text: 'Detect, speak and qualify in the caller’s own language and accent.', viz: (
        <div className="mt-5 flex flex-wrap gap-1.5 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{['EN', 'ES', 'FR', 'DE', 'PT', 'HI', 'AR', 'BN', '+21'].map((x) => <span key={x} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.03]">{x}</span>)}</div>) },
    { span: 'lg:col-span-2', icon: FileAudio, title: 'Recordings & transcripts', text: 'Auto-recording, AI transcription, summaries and searchable history for every single call.', viz: (
        <div className="mt-5 space-y-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs dark:border-white/5 dark:bg-ink-950/40">
            <p className="text-brand-600 dark:text-brand-300"><span className="text-neutral-400 dark:text-neutral-600">00:12 </span>Ava: …are you evaluating for a team?</p>
            <p className="text-neutral-700 dark:text-neutral-300"><span className="text-neutral-400 dark:text-neutral-600">00:15 </span>Marcus: yeah, about eight of us.</p>
            <p className="text-signal-600 dark:text-signal-300"><span className="text-neutral-400 dark:text-neutral-600">summary </span>Team of 8 · budget approved · demo booked</p>
        </div>) },
    { span: '', icon: Workflow, title: 'Visual flow builder', text: 'Branch on outcomes: send an SMS, book a call, or escalate to a human.', viz: (
        <div className="mt-5 flex items-center gap-2 font-mono text-[11px]"><span className="rounded-md bg-signal-500/10 px-2 py-1 text-signal-600 dark:text-signal-300">Trigger</span><span className="text-neutral-400">→</span><span className="rounded-md bg-warm/10 px-2 py-1 text-amber-600 dark:text-warm">If Hot</span><span className="text-neutral-400">→</span><span className="rounded-md bg-brand-500/10 px-2 py-1 text-brand-600 dark:text-brand-300">Book</span></div>) },
    { span: '', icon: Cable, title: 'CRM & webhooks', text: 'Push qualified leads to any tool in real time.', viz: (
        <div className="mt-5 flex flex-wrap gap-1.5 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{['Salesforce', 'HubSpot', 'Pipedrive', 'Webhook'].map((x) => <span key={x} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.03]">{x}</span>)}</div>) },
];

const MODULES = [
    { icon: Bot, cat: 'AI Agents', accent: 'brand', desc: 'Design voice agents with a goal, personality and knowledge — then let them hold the conversation.', items: ['Voice, personality & goals', 'Prompt template library', 'Knowledge-base grounding', 'Per-agent engine selection'] },
    { icon: PhoneCall, cat: 'Outbound Calling', accent: 'signal', desc: 'Dial thousands of contacts with a smart, self-throttling dialer that never sleeps.', items: ['Bulk campaigns & scheduling', 'Concurrency-aware dialer', 'Retries & daily caps', 'Recordings & transcripts'] },
    { icon: Target, cat: 'Lead Intelligence', accent: 'warm', desc: 'Score and summarize every conversation the moment it ends — no manual review.', items: ['Hot / Warm / Cold scoring', 'Sentiment analysis', 'AI call summaries', 'Real-time analytics & reports'] },
    { icon: Workflow, cat: 'Automation & Flows', accent: 'brand', desc: 'Turn call outcomes into automatic next steps with a visual, branching flow builder.', items: ['Visual flow builder', 'Outcome-based branching', 'Templates & execution logs', 'Triggers, conditions & actions'] },
    { icon: MessageSquare, cat: 'Messaging', accent: 'cold', desc: 'Follow up across SMS, WhatsApp and email from one connected inbox.', items: ['SMS, WhatsApp & email', 'Reusable templates', 'Conversations inbox', 'Post-call follow-ups'] },
    { icon: Gift, cat: 'Growth & Marketing', accent: 'warm', desc: 'Grow your base with vouchers, gift cards and a built-in referral program.', items: ['Vouchers & discount codes', 'Branded gift cards', 'Referral program', 'Quick-CRM kanban pipeline'] },
    { icon: ClipboardList, cat: 'Tools', accent: 'signal', desc: 'Capture and route more leads with forms, appointments, a chat widget and inbound routing.', items: ['Forms & submissions', 'Appointment booking', 'Website chat widget', 'Inbound call routing', 'Google Sheets sync'] },
    { icon: Plug, cat: 'Integrations & API', accent: 'cold', desc: 'Connect anything with a REST API, webhooks and bring-your-own SIP carrier.', items: ['REST API + API keys', 'Webhooks', 'CRM sync', 'SIP / bring-your-own carrier'] },
    { icon: Layers, cat: 'Admin & Multi-tenant', accent: 'brand', desc: 'Operate the whole platform — every customer and call — from a super-admin console.', items: ['Customer management', 'Engines & call monitoring', 'Batch-job oversight', 'Roles, KYC & audit log'] },
    { icon: KeyRound, cat: 'Billing & Plans', accent: 'signal', desc: 'Charge customers with credits, subscription plans and multiple payment gateways.', items: ['Credit-based billing', 'Subscription plans', 'Payment gateways', 'Invoices & currencies'] },
];

const USE_CASES = [
    { icon: Briefcase, title: 'Sales & SDR', text: 'Qualify inbound and outbound leads at scale, book demos and route hot prospects to reps instantly.', line: 'Ava: “Are you evaluating for a team?” — Marcus: “Yes, about eight of us.”', outcome: 'Demo booked · Hot lead', accent: 'brand' },
    { icon: Users, title: 'Recruiting', text: 'Screen candidates over the phone, confirm availability and shortlist — before a human ever dials.', line: 'Leo: “Open to a senior role, remote-friendly?” — “Definitely, when can we talk?”', outcome: 'Candidate shortlisted', accent: 'signal' },
    { icon: Home, title: 'Real estate', text: 'Follow up with property enquiries, gauge intent and schedule viewings around the clock.', line: 'Sol: “Still interested in the 2-bed on Elm St?” — “Can I view Saturday?”', outcome: 'Viewing scheduled', accent: 'warm' },
    { icon: Search, title: 'Surveys & research', text: 'Run multilingual phone surveys and capture structured, transcribed responses automatically.', line: 'Mia: “On a scale of 1–5, how was support?” — “I’d say a five.”', outcome: 'Response captured', accent: 'cold' },
    { icon: Headphones, title: 'Support callbacks', text: 'Text-back missed calls, run first-line triage and escalate only what needs a person.', line: 'Nia: “Sorry we missed you — a callback at 3pm?” — “Perfect, thanks.”', outcome: 'Callback queued', accent: 'brand' },
    { icon: Building2, title: 'Agencies & resellers', text: 'Spin up isolated tenant accounts, brand them, and sell AI calling as your own SaaS.', line: 'Tenant “Acme Agency” provisioned · 3 agents · fully white-labeled.', outcome: 'Reselling live', accent: 'signal' },
];

const COMPARE_ROWS = [
    ['Time to launch', 'Months', 'Weeks', 'Same day'],
    ['Real AI conversations', false, false, true],
    ['Hot / Warm / Cold scoring', false, false, true],
    ['Multi-tenant SaaS + billing', false, false, true],
    ['Own the source code', true, false, true],
    ['Choose your providers', true, false, true],
    ['Admin oversight & monitoring', false, 'Limited', true],
];

const SECURITY = [
    { icon: Lock, title: 'Encrypted credentials', text: 'Provider keys and secrets are stored encrypted at rest, never exposed to the browser.' },
    { icon: ShieldCheck, title: 'RBAC & audit trail', text: 'Granular role-based permissions with a full audit log of sensitive actions.' },
    { icon: Gauge, title: 'Built to scale', text: 'A queue-driven, concurrency-aware dialer with a load-balanced voice-key pool.' },
    { icon: Server, title: 'Self-hosted & portable', text: 'Runs on any VPS, dedicated server or container host. Your app, your data, your keys.' },
];
const STACK = [
    { l: 'Next.js 15 + React 19', d: 'App Router, server actions, SSR', a: 'brand' },
    { l: 'Prisma 6 + MySQL 8', d: 'Typed data layer, clean schema', a: 'signal' },
    { l: 'Worker & scheduler', d: 'Concurrency-aware dialer + jobs', a: 'warm' },
    { l: 'Providers', d: 'Twilio · Plivo · ElevenLabs · OpenAI', a: 'cold' },
];

const METRICS = [
    { v: '12,000+', l: 'Calls / hour', s: 'concurrency-aware dialer' },
    { v: '29', l: 'Languages', s: 'region-specific accents' },
    { v: '0:47', l: 'Avg. time to qualify', s: 'per conversation' },
    { v: '99.9%', l: 'Uptime ready', s: 'load-balanced voice pool' },
];

const DELIVERABLES = [
    ['Two complete panels', 'Customer dashboard + super-admin control panel.'],
    ['Multi-tenant SaaS core', 'Customers, plans, credits, payments and gateways.'],
    ['Documentation', 'Setup, configuration and common-task guides.'],
    ['Regular updates', 'New features, fixes and provider improvements.'],
    ['Buyer support', 'Help with installation and bug fixes.'],
    ['White-label branding', 'Name, logo, colors, languages and currencies.'],
    ['REST API & webhooks', 'Wire it into anything you already run.'],
];

const TESTIMONIALS = [
    { q: 'It replaced a five-person SDR team on outbound. The agent qualifies while we sleep, and leads land in HubSpot already scored. Our first campaign paid for the whole year.', n: 'Dana Reyes', r: 'VP Growth · Northwind SaaS', i: 'DR', featured: true },
    { q: 'We white-labeled it and resold AI calling to twelve clients in a month. The multi-tenant admin made it trivial.', n: 'Samir Khan', r: 'Founder · Dialworks Agency', i: 'SK' },
    { q: 'Setup took an afternoon. Bring-your-own Twilio and ElevenLabs keys, launch a campaign, done.', n: 'Elena Voss', r: 'RevOps Lead · Kestrel', i: 'EV' },
];

const PLANS = [
    { name: 'Starter', m: 29, a: 24, blurb: 'For solo founders testing the waters.', features: ['1 AI agent', '500 call credits', '2 languages', 'Recordings & transcripts'], cta: 'Start free', highlight: false },
    { name: 'Growth', m: 79, a: 66, blurb: 'For teams running real campaigns.', features: ['5 AI agents', '5,000 call credits', 'All 29 languages', 'Lead scoring + CRM sync', 'Flows & webhooks'], cta: 'Start free trial', highlight: true },
    { name: 'Scale', m: 199, a: 166, blurb: 'For high-volume outbound teams.', features: ['Unlimited agents', '25,000 call credits', 'Priority dialer', 'SIP & bring-your-own carrier', 'Team roles & audit log'], cta: 'Talk to us', highlight: false },
];

/* ---------- interactive: module explorer ---------- */
function ModuleExplorer() {
    const [active, setActive] = useState(0);
    const m = MODULES[active];
    const a = ACC[m.accent];
    return (
        <div className="mt-12 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                {MODULES.map((mod, i) => {
                    const on = i === active;
                    const ac = ACC[mod.accent];
                    return (
                        <button key={mod.cat} onClick={() => setActive(i)} aria-pressed={on}
                            className={`group flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition lg:w-full ${on ? 'border-neutral-300 bg-white shadow-soft dark:border-white/15 dark:bg-white/[0.06] dark:shadow-none' : 'border-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/[0.03]'}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${ac.tile}`}><mod.icon className="h-4 w-4" /></span>
                            <span className={`font-medium ${on ? 'text-neutral-900 dark:text-white' : ''}`}>{mod.cat}</span>
                        </button>
                    );
                })}
            </div>
            <div className={`relative overflow-hidden ${CARD} p-6 sm:p-8`}>
                <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${a.dot} opacity-[0.07] blur-3xl`} />
                <div className="relative flex items-start gap-4">
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${a.tile}`}><m.icon className="h-7 w-7" /></span>
                    <div>
                        <h3 className="font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{m.cat}</h3>
                        <p className="mt-1.5 max-w-lg text-neutral-600 dark:text-neutral-400">{m.desc}</p>
                    </div>
                </div>
                <div className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
                    {m.items.map((x) => (
                        <div key={x} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700 dark:border-white/5 dark:bg-white/[0.02] dark:text-neutral-300">
                            <Check className={`h-4 w-4 shrink-0 ${a.text}`} />{x}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- interactive: use-case tabs ---------- */
function UseCaseTabs() {
    const [active, setActive] = useState(0);
    const u = USE_CASES[active];
    const a = ACC[u.accent];
    return (
        <div className="mt-12">
            <div className="flex flex-wrap gap-2">
                {USE_CASES.map((uc, i) => {
                    const on = i === active;
                    return (
                        <button key={uc.title} onClick={() => setActive(i)} aria-pressed={on}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? 'border-transparent bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.04]'}`}>
                            <uc.icon className="h-4 w-4" />{uc.title}
                        </button>
                    );
                })}
            </div>
            <div className={`mt-6 grid items-center gap-8 ${CARD} p-6 sm:p-10 lg:grid-cols-2`}>
                <div>
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${a.tile}`}><u.icon className="h-6 w-6" /></span>
                    <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{u.title}</h3>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">{u.text}</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-signal-500/10 px-3 py-1.5 text-sm font-medium text-signal-600 dark:text-signal-300"><Check className="h-4 w-4" /> {u.outcome}</div>
                </div>
                {/* scenario mock */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700"><Bot className="h-3.5 w-3.5" /></span>Live call</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-signal-300"><span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-pulse-signal" /> 00:31</span>
                    </div>
                    <div className="mt-4"><WaveBars count={30} h="h-8" /></div>
                    <p className="mt-4 rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10">{u.line}</p>
                    <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-neutral-500"><span className="rounded bg-signal-500/15 px-1.5 py-0.5 text-signal-300">outcome</span> {u.outcome}</div>
                </div>
            </div>
        </div>
    );
}

function FaqPreview() {
    const [open, setOpen] = useState(0);
    const items = FAQ_FLAT.slice(0, 6);
    return (
        <div className={`mx-auto mt-12 max-w-3xl divide-y divide-neutral-200 overflow-hidden ${CARD} dark:divide-white/10`}>
            {items.map((f, i) => (
                <div key={i}>
                    <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
                        <span className="font-medium text-neutral-900 dark:text-white">{f.q}</span>
                        <span className={`shrink-0 rounded-md border border-neutral-200 p-1 text-neutral-500 transition dark:border-white/10 dark:text-neutral-400 ${open === i ? 'rotate-45 text-brand-500 dark:text-brand-300' : ''}`}><Sparkles className="h-3.5 w-3.5" /></span>
                    </button>
                    {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{f.a}</p>}
                </div>
            ))}
        </div>
    );
}

export default function Welcome() {
    const page = usePage().props;
    const user = page?.auth?.user;
    const brand = page?.branding?.system_title || 'CallMineAI';
    const primaryHref = user ? route('client.dashboard') : route('register');
    const primaryLabel = user ? 'Go to dashboard' : 'Start calling free';
    const [annual, setAnnual] = useState(false);

    const schema = {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: brand, applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
        description: 'AI voice agents that place outbound calls, qualify leads Hot/Warm/Cold and sync them to your CRM, with a multi-tenant admin, billing and REST API.',
        offers: { '@type': 'Offer', price: '29', priceCurrency: 'USD' },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127' },
    };

    return (
        <MarketingLayout schema={schema}>
            {/* ===== Hero (kept) ===== */}
            <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
                <div className="pointer-events-none absolute inset-x-0 -top-40 z-0 h-[40rem]" aria-hidden="true">
                    <div className="absolute left-1/2 top-0 h-[30rem] w-[54rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-[120px] dark:bg-brand-600/20" />
                    <div className="absolute left-1/4 top-24 h-72 w-72 rounded-full bg-signal-500/20 blur-[100px] dark:bg-signal-500/15" />
                    <div className="absolute right-1/4 top-10 h-72 w-72 rounded-full bg-cold/15 blur-[110px] dark:bg-transparent" />
                </div>
                <div className="mk-beam grid-mask pointer-events-none absolute inset-x-0 -top-24 z-0 h-[38rem]" aria-hidden="true" />
                <div className="grid-field hero-grid-mask pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
                <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
                    <div>
                        <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-signal-500" /></span><span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-600 dark:text-neutral-300">AI voice operator · live</span></span></Reveal>
                        <Reveal delay={80}><h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.03] tracking-tight text-neutral-900 dark:text-white sm:text-6xl lg:text-[4.1rem]">AI agents that <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-signal-500 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-signal-400">call, talk</span> and qualify your leads.</h1></Reveal>
                        <Reveal delay={160}><p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">Spin up a voice agent, launch a bulk campaign, and let it hold real phone conversations — recorded, transcribed and scored Hot / Warm / Cold in real time, then synced to your CRM. A complete, self-hosted, multi-tenant platform.</p></Reveal>
                        <Reveal delay={240}><div className="mt-9 flex flex-wrap items-center gap-3">
                            <Link href={primaryHref} className="sheen group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/40 transition hover:bg-brand-500">{primaryLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link>
                            <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 shadow-soft transition hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:shadow-none dark:hover:bg-white/[0.08]"><Play className="h-4 w-4 text-signal-500 dark:text-signal-400" /> See how it works</a>
                        </div></Reveal>
                        <Reveal delay={320}><div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs text-neutral-500">
                            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-signal-500 dark:text-signal-400" /> Self-hosted source</span>
                            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-signal-500 dark:text-signal-400" /> Bring your own keys</span>
                            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-signal-500 dark:text-signal-400" /> Live in minutes</span>
                        </div></Reveal>
                    </div>
                    <Reveal delay={200} className="lg:pl-4"><CallConsole /></Reveal>
                </div>
            </section>

            {/* ===== Trust marquee ===== */}
            <section id="integrations" className="scroll-mt-24 border-y border-neutral-200 mk-wash py-8 dark:border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Plugs into the stack you already run</p>
                    <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
                        <div className="marq flex w-max items-center gap-14 whitespace-nowrap pr-14">{[...PROVIDERS, ...PROVIDERS].map((p, i) => <span key={i} className="font-display text-xl font-semibold text-neutral-400 dark:text-neutral-500/70">{p}</span>)}</div>
                    </div>
                </div>
            </section>

            {/* ===== Problem → solution (redesigned: split transformation) ===== */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <Eyebrow className="justify-center">Why it exists</Eyebrow>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">Most leads die waiting for a callback.</h2>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Reps can only dial so fast. Follow-ups slip, timezones collide, and the best prospects go cold. Hiring more callers is slow and expensive — and still misses nights, weekends and spikes.</p>
                    </Reveal>
                    <Reveal delay={120}>
                        <div className="relative mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-white/10 dark:bg-ink-900/40">
                                <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">The old way</p>
                                <ul className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                                    {['Leads wait hours for a callback', 'Reps burn time on cold prospects', 'No coverage after 6pm', 'Follow-ups fall through the cracks'].map((x) => <li key={x} className="flex items-start gap-2.5"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-600" />{x}</li>)}
                                </ul>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-signal-500 text-white shadow-lg shadow-brand-600/40"><ArrowRight className="h-5 w-5 lg:rotate-0" /></span>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/[0.08] to-transparent p-6 dark:from-brand-500/10">
                                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/20 blur-2xl" />
                                <p className="relative inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-brand-600 dark:text-brand-300"><Sparkles className="h-3.5 w-3.5" /> With {brand}</p>
                                <ul className="relative mt-4 space-y-3 text-sm text-neutral-800 dark:text-neutral-200">
                                    {['Every lead called within minutes', 'Only qualified leads reach reps', 'Agents run 24/7, in any language', 'Flows auto-follow-up & book meetings'].map((x) => <li key={x} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-500 dark:text-signal-400" />{x}</li>)}
                                </ul>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== How it works (redesigned: connected timeline) ===== */}
            <section id="how" className="scroll-mt-24 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="How it works" title="From zero to qualified leads in three moves." sub="No dialers to babysit. No scripts to memorize. Set the goal and let the agent work the phones." /></Reveal>
                    <div className="relative mt-16">
                        <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent md:block" aria-hidden="true" />
                        <div className="grid gap-6 md:grid-cols-3">
                            {STEPS.map((s, i) => (
                                <Reveal key={s.n} delay={i * 120}>
                                    <div className="relative">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white font-mono text-sm font-bold text-brand-600 shadow-soft dark:border-white/15 dark:bg-ink-900 dark:text-brand-300 dark:shadow-none">{s.n}</div>
                                        <div className={`mt-6 h-full ${CARD} group p-6 transition hover:-translate-y-1`}>
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/12 text-brand-600 ring-1 ring-brand-500/20 dark:text-brand-300"><s.icon className="h-5 w-5" /></span>
                                            <h3 className="mt-4 font-display text-lg font-semibold text-neutral-900 dark:text-white">{s.title}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{s.text}</p>
                                            <div className="mt-4 flex flex-wrap gap-1.5">{s.chips.map((c) => <span key={c} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[10px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">{c}</span>)}</div>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== The calling engine (kept: core bento) ===== */}
            <section id="features" className="scroll-mt-24 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="The calling engine" title="A full calling stack, not a chatbot with a phone." /></Reveal>
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {CORE.map((f, i) => (
                            <Reveal key={f.title} delay={(i % 3) * 90} className={f.span}>
                                <div className={`group relative flex h-full flex-col overflow-hidden ${CARD} p-6 transition hover:border-brand-300 dark:hover:border-white/20`}>
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-signal-500/20 text-brand-600 ring-1 ring-brand-500/20 dark:text-brand-200 dark:ring-white/10"><f.icon className="h-5 w-5" /></span>
                                    <h3 className="mt-4 font-display text-lg font-semibold text-neutral-900 dark:text-white">{f.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{f.text}</p>{f.viz}
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

             {/* ===== Inside the product (kept: dashboard preview) ===== */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal className="mx-auto max-w-2xl text-center"><SectionHead center eyebrow="Inside the product" title="A dashboard your whole team will actually use." /></Reveal>
                    <Reveal delay={120}>
                        <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 shadow-[0_40px_120px_-40px_rgba(109,63,234,0.5)]">
                            <div className="flex items-center gap-2 border-b border-white/10 bg-ink-950/60 px-4 py-3">
                                <span className="h-3 w-3 rounded-full bg-hot/70" /><span className="h-3 w-3 rounded-full bg-warm/70" /><span className="h-3 w-3 rounded-full bg-signal-500/70" />
                                <span className="ml-3 font-mono text-[11px] text-neutral-500">app / dashboard</span>
                            </div>
                            <div className="grid gap-4 p-5 sm:grid-cols-4">
                                {[['Calls (30d)', '4,182'], ['Success', '68%'], ['Qualified', '1,204'], ['Avg call', '1:12']].map(([l, v]) => (
                                    <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{l}</p><p className="mt-1 font-display text-2xl font-bold text-white">{v}</p></div>
                                ))}
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-3">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Calls this week</p>
                                    <div className="mt-4 flex items-end gap-2">{[40, 62, 48, 80, 68, 92, 74].map((h, i) => <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${h}px` }} />)}</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Lead mix</p>
                                    <div className="mt-4 space-y-2">{[['Hot', 'bg-hot', '30%'], ['Warm', 'bg-warm', '45%'], ['Cold', 'bg-cold', '25%']].map(([l, c, w]) => (<div key={l}><div className="flex justify-between text-[11px] text-neutral-400"><span>{l}</span><span className="font-mono">{w}</span></div><div className="mt-1 h-1.5 rounded-full bg-white/5"><div className={`h-full rounded-full ${c}`} style={{ width: w }} /></div></div>))}</div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Everything included (redesigned: interactive explorer) ===== */}
            <section className="border-y border-neutral-200 mk-wash py-24 dark:border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead center eyebrow="Everything in the box" title="Ten modules. One platform." sub="Click through every capability — from the first dial to the qualified lead in your CRM." /></Reveal>
                    <Reveal delay={100}><ModuleExplorer /></Reveal>
                </div>
            </section>


            {/* ===== Use cases (redesigned: tabs + scenario) ===== */}
            <section id="usecases" className="scroll-mt-24 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="Who it’s for" title="One platform, many playbooks." sub="If your business qualifies people over the phone, an AI agent can do the first mile." /></Reveal>
                    <Reveal delay={100}><UseCaseTabs /></Reveal>
                </div>
            </section>

            {/* ===== Comparison (redesigned: elevated column) ===== */}
            <section className="border-y border-neutral-200 mk-wash py-24 dark:border-white/5">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead center eyebrow="Why choose this" title="The shortcut to a real AI-calling product." /></Reveal>
                    <Reveal delay={100}>
                        <div className={`mt-12 overflow-hidden ${CARD}`}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-white/10">
                                        <th className="px-4 py-4 text-left font-mono text-[11px] uppercase tracking-widest text-neutral-500 sm:px-6"> </th>
                                        <th className="px-4 py-4 text-center font-semibold text-neutral-500 sm:px-6">Build it yourself</th>
                                        <th className="px-4 py-4 text-center font-semibold text-neutral-500 sm:px-6">Generic dialer</th>
                                        <th className="px-4 py-4 text-center sm:px-6"><span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white shadow-lg shadow-brand-600/30">{brand}</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                                    {COMPARE_ROWS.map(([label, ...vals]) => (
                                        <tr key={label}>
                                            <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-300 sm:px-6">{label}</td>
                                            {vals.map((v, i) => (
                                                <td key={i} className={`px-4 py-3.5 text-center sm:px-6 ${i === 2 ? 'bg-brand-500/[0.05] dark:bg-brand-500/[0.08]' : ''}`}>
                                                    {v === true ? <Check className={`mx-auto h-4 w-4 ${i === 2 ? 'text-signal-500 dark:text-signal-400' : 'text-neutral-400'}`} /> : v === false ? <Minus className="mx-auto h-4 w-4 text-neutral-300 dark:text-neutral-700" /> : <span className={`font-mono text-xs ${i === 2 ? 'font-semibold text-signal-600 dark:text-signal-300' : 'text-neutral-500'}`}>{v}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Admin / multi-tenant (kept-ish, theme-aware) ===== */}
            <section className="py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <Reveal>
                        <Eyebrow>SaaS-ready</Eyebrow>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">Run it for one team — or sell it to a thousand.</h2>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">A complete super-admin control panel sits on top of the customer app. Onboard customer accounts, assign plans and credits, configure engines, and watch the whole platform in real time.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {[['Customer management', Users], ['Live call monitoring', BarChart3], ['Batch-job oversight', Layers], ['Engines & providers', Server], ['Payments & subscriptions', KeyRound], ['Roles, KYC & audit', ShieldCheck]].map(([t, Icon]) => (
                                <div key={t} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 shadow-soft dark:border-white/10 dark:bg-ink-900/50 dark:shadow-none"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/12 text-brand-600 dark:text-brand-300"><Icon className="h-4 w-4" /></span><span className="text-sm text-neutral-800 dark:text-neutral-200">{t}</span></div>
                            ))}
                        </div>
                    </Reveal>
                    <Reveal delay={120}>
                        <div className="rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3"><p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">Admin · Call monitoring</p><span className="inline-flex items-center gap-1 font-mono text-[10px] text-signal-300"><span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-pulse-signal" /> live</span></div>
                            <div className="mt-4 space-y-2">
                                {[['Northwind SaaS', 'Ava', 'in progress', 'text-signal-400'], ['Kestrel', 'Leo', 'ringing', 'text-warm'], ['Dialworks', 'Mia', 'completed', 'text-neutral-400'], ['Peak Realty', 'Sol', 'completed', 'text-neutral-400']].map(([v, ag, s, c], i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"><span className="text-neutral-200">{v}</span><span className="font-mono text-xs text-neutral-500">{ag}</span><span className={`font-mono text-[11px] ${c}`}>{s}</span></div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Security & architecture (redesigned: bento + stack) ===== */}
            <section className="border-y border-neutral-200 mk-wash py-24 dark:border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="Trust & architecture" title="Built to be owned, extended and trusted." sub="A modern, secure, self-hosted foundation you control end to end." /></Reveal>
                    <div className="mt-14 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                        <Reveal>
                            <div className={`relative h-full overflow-hidden ${CARD} p-6`}>
                                <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">The stack</p>
                                <div className="mt-4 space-y-2.5">
                                    {STACK.map((s, i) => {
                                        const a = ACC[s.a];
                                        return (
                                            <div key={s.l} className="relative flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]" style={{ marginLeft: `${i * 10}px` }}>
                                                <span className={`h-2.5 w-2.5 rounded-full ${a.dot}`} />
                                                <div><p className="text-sm font-semibold text-neutral-900 dark:text-white">{s.l}</p><p className="text-xs text-neutral-500">{s.d}</p></div>
                                                {i < STACK.length - 1 && <span className="absolute -bottom-2.5 left-5 h-2.5 w-px bg-neutral-300 dark:bg-white/10" aria-hidden="true" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-5 flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-3.5 py-2.5 text-sm text-brand-700 dark:text-brand-200">
                                    <Layers className="h-4 w-4" /> Multi-tenant isolation on every record — enforced at the model layer.
                                </div>
                            </div>
                        </Reveal>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {SECURITY.map((s, i) => (
                                <Reveal key={s.title} delay={(i % 2) * 90}>
                                    <div className={`h-full ${CARD} p-6`}>
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500/12 text-signal-600 ring-1 ring-signal-500/20 dark:text-signal-300"><s.icon className="h-5 w-5" /></span>
                                        <h3 className="mt-4 font-display text-base font-semibold text-neutral-900 dark:text-white">{s.title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{s.text}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Metrics (animated counters) ===== */}
            <section className="px-4 py-14 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-900 to-ink-950 p-10 shadow-2xl sm:p-14">
                        <div className="grid-field pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" />
                        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand-600/25 blur-[90px]" aria-hidden="true" />
                        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-signal-500/20 blur-[90px]" aria-hidden="true" />
                        <div className="relative grid gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                            {METRICS.map((m) => (<div key={m.l} className="text-center lg:text-left"><Counter value={m.v} className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl" /><p className="mt-2 font-mono text-xs uppercase tracking-widest text-signal-400">{m.l}</p><p className="mt-1 text-sm text-neutral-400">{m.s}</p></div>))}
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ===== What you get (redesigned: featured source-code) ===== */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="What you get" title="A complete product, not a starter kit." sub="Everything you need to launch — source, docs, updates and support." /></Reveal>
                    <div className="mt-12 grid gap-4 lg:grid-cols-[1.15fr_1.85fr]">
                        <Reveal>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-xl">
                                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/20 blur-3xl" />
                                <div className="relative flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Code2 className="h-5 w-5" /></span><div><p className="font-semibold text-white">Full source code</p><p className="font-mono text-[11px] text-neutral-500">self-host · customize · own it</p></div></div>
                                <div className="relative mt-5 space-y-1 rounded-xl border border-white/10 bg-ink-950/60 p-4 font-mono text-xs text-neutral-400">
                                    {['app/', '  Http/Controllers/', '  Models/', '  Services/', 'resources/js/Pages/', 'routes/', 'database/migrations/'].map((f, i) => <p key={i} className={i % 3 === 0 ? 'text-brand-300' : ''}>{f}</p>)}
                                </div>
                            </div>
                        </Reveal>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {DELIVERABLES.map(([t, d], i) => (
                                <Reveal key={t} delay={(i % 2) * 70}>
                                    <div className={`flex h-full gap-3 ${CARD} p-5`}>
                                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-signal-500 dark:text-signal-400" />
                                        <div><p className="font-semibold text-neutral-900 dark:text-white">{t}</p><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{d}</p></div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Testimonials (redesigned: asymmetric featured) ===== */}
            <section className="border-y border-neutral-200 mk-wash py-24 dark:border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead eyebrow="Loved by outbound teams" title="Results, not just conversations." /></Reveal>
                    <div className="mt-14 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                        <Reveal>
                            <figure className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/[0.08] to-transparent p-8 dark:from-brand-500/10">
                                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />
                                <div className="relative"><div className="flex gap-1 text-warm" aria-hidden="true">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-5 w-5 fill-current" />)}</div>
                                    <blockquote className="mt-5 font-display text-2xl font-medium leading-snug text-neutral-900 dark:text-white">“{TESTIMONIALS[0].q}”</blockquote></div>
                                <figcaption className="relative mt-8 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-signal-500 font-display font-bold text-white">{TESTIMONIALS[0].i}</span><div><p className="font-semibold text-neutral-900 dark:text-white">{TESTIMONIALS[0].n}</p><p className="font-mono text-[11px] text-neutral-500">{TESTIMONIALS[0].r}</p></div></figcaption>
                            </figure>
                        </Reveal>
                        <div className="grid gap-4">
                            {TESTIMONIALS.slice(1).map((t, i) => (
                                <Reveal key={t.n} delay={i * 100}>
                                    <figure className={`flex h-full flex-col justify-between ${CARD} p-6`}>
                                        <div><div className="flex gap-1 text-warm" aria-hidden="true">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
                                            <blockquote className="mt-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-200">“{t.q}”</blockquote></div>
                                        <figcaption className="mt-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-signal-500 text-sm font-bold text-white">{t.i}</span><div><p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.n}</p><p className="font-mono text-[11px] text-neutral-500">{t.r}</p></div></figcaption>
                                    </figure>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Pricing (billing toggle) ===== */}
            <section id="pricing" className="scroll-mt-24 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead center eyebrow="Pricing" title="Start free. Scale when the leads roll in." sub="Credit-based pricing — you only pay for calls that actually connect." /></Reveal>
                    <Reveal delay={80}>
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <span className={`text-sm ${!annual ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>Monthly</span>
                            <button onClick={() => setAnnual((v) => !v)} role="switch" aria-checked={annual} className={`relative h-6 w-11 rounded-full transition ${annual ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-white/15'}`}>
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${annual ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                            <span className={`text-sm ${annual ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>Annual <span className="ml-1 rounded-full bg-signal-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-signal-600 dark:text-signal-300">2 months free</span></span>
                        </div>
                    </Reveal>
                    <div className="mx-auto mt-12 grid max-w-5xl items-start gap-5 lg:grid-cols-3">
                        {PLANS.map((p, i) => (
                            <Reveal key={p.name} delay={i * 100}>
                                <div className={`relative flex h-full flex-col rounded-3xl border p-7 ${p.highlight ? 'border-brand-500/50 bg-gradient-to-b from-brand-500/[0.06] to-white shadow-[0_30px_80px_-30px_rgba(109,63,234,0.35)] dark:from-brand-500/10 dark:to-ink-900/60 dark:shadow-[0_30px_80px_-30px_rgba(109,63,234,0.6)]' : `${CARD}`}`}>
                                    {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">Most popular</span>}
                                    <p className="font-display text-lg font-semibold text-neutral-900 dark:text-white">{p.name}</p>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.blurb}</p>
                                    <p className="mt-5 flex items-baseline gap-1"><span className="font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">${annual ? p.a : p.m}</span><span className="font-mono text-sm text-neutral-500">/mo</span></p>
                                    {annual && <p className="mt-1 font-mono text-[11px] text-signal-600 dark:text-signal-300">billed annually</p>}
                                    <ul className="mt-6 space-y-2.5 text-sm">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-500 dark:text-signal-400" />{f}</li>)}</ul>
                                    <Link href={user ? route('client.dashboard') : route('register')} className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${p.highlight ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/40 hover:bg-brand-500' : 'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]'}`}>{p.cta}</Link>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FAQ preview ===== */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal><SectionHead center eyebrow="Questions" title="Everything you need to decide." sub="Common pre-sales questions, answered." /></Reveal>
                    <Reveal delay={100}><FaqPreview /></Reveal>
                    <Reveal delay={160}><div className="mt-8 text-center"><Link href={route('frontend.faq')} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">See all questions <ArrowRight className="h-4 w-4" /></Link></div></Reveal>
                </div>
            </section>

            {/* ===== Final CTA (kept dark) ===== */}
            <section className="px-4 pb-24 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 px-8 py-16 text-center sm:px-12">
                        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true"><div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-signal-400/25 blur-[90px]" /><div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-brand-400/30 blur-[90px]" /></div>
                        <div className="relative">
                            <div className="mx-auto mb-6 w-fit"><WaveBars count={30} h="h-8" /></div>
                            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">Put an AI caller on the phones tonight.</h2>
                            <p className="mx-auto mt-4 max-w-xl text-brand-100/90">Build an agent, upload your list, and watch qualified leads arrive — all before your morning coffee.</p>
                            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                                <Link href={primaryHref} className="sheen inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-xl transition hover:bg-brand-50">{primaryLabel} <ArrowRight className="h-4 w-4" /></Link>
                                {!user && <Link href={route('login')} className="rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Log in</Link>}
                            </div>
                            <p className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-brand-100/70"><ShieldCheck className="h-3.5 w-3.5" /> Self-hosted · bring your own keys · cancel anytime</p>
                        </div>
                    </div>
                </Reveal>
            </section>
        </MarketingLayout>
    );
}
