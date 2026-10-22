'use client';

import { Link, usePage } from '@/lib/page-router';
import BrandMark, { BrandName } from '@/components/BrandMark';

const imgClass = 'h-8 max-h-8 w-auto max-w-[10rem] shrink-0 object-contain object-left';

/**
 * Sidebar header brand. Shows the uploaded site logo if one is set, otherwise a
 * neutral text wordmark built from the app name. Replace with your own logo by
 * uploading one in settings, or swap this component for an <img> of your brand.
 *
 * @param {{ href: string, ariaLabel: string }} props
 */
export default function SidebarBrandLink({ href, ariaLabel }) {
    const props = usePage().props;
    const siteLogoUrl = props.branding?.site_logo_url ?? null;
    const brand = props.branding?.company_name || props.branding?.system_title || props.system_title || 'CallMineAI';

    return (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-1" aria-label={ariaLabel}>
            {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={brand} className={`${imgClass} dark:opacity-95`} />
            ) : (
                <>
                    <BrandMark variant="dark" className="h-9 w-9 shrink-0" />
                    <span className="truncate font-display text-base font-bold tracking-tight text-white">
                        <BrandName brand={brand} />
                    </span>
                </>
            )}
        </Link>
    );
}
