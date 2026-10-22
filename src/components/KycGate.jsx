'use client';

import { route } from '@/lib/route';
import { usePage, Link } from '@/lib/page-router';
import { ShieldAlert, Clock, ArrowRight } from 'lucide-react';

/**
 * Inline "verify your business to unlock" notice. Renders nothing once the
 * customer is KYC-verified. Enforcement is server-side (kyc.verified middleware);
 * this is the guidance/CTA on gated pages.
 */
export default function KycGate({ action = 'use this feature' }) {
    const c = usePage().props.auth?.customer;
    if (!c || c.kyc_verified) return null;
    const pending = c.kyc_status === 'pending';

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-soft-lg border border-warm/30 bg-warm/10 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm/20 text-amber-600 dark:text-amber-300">
                {pending ? <Clock className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                    {pending ? 'Verification in review' : `Verify your business to ${action}`}
                </p>
                <p className="text-sm text-amber-700/90 dark:text-amber-300/80">
                    {pending ? 'We’ll notify you once your documents are approved.' : `Upload your business documents to unlock the ability to ${action}.`}
                </p>
            </div>
            <Link href={route('client.kyc.index')} className="inline-flex shrink-0 items-center gap-1.5 rounded-soft bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600">
                {pending ? 'View status' : 'Verify now'} <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
