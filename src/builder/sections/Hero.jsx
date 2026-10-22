'use client';

/**
 * Hero section – 3 variants: centered, split, minimal.
 */
export default function Hero({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
  const variant = p.variant || 'centered';
  const base = 'border-l-4 ' + (isSelected ? 'border-brand-500' : 'border-transparent');
  const wrap = (children) => (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition ${base}`}
      {...rest}
    >
      {children}
    </div>
  );

  if (variant === 'minimal') {
    return wrap(
      <div className="px-8 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-neutral-100">{p.title ?? 'Hero'}</h1>
        {p.subtitle && <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">{p.subtitle}</p>}
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          {p.ctaText && (
            <a href={p.ctaUrl || '#'} className="inline-flex px-5 py-2.5 bg-brand-600 text-white rounded-soft font-medium">
              {p.ctaText}
            </a>
          )}
          {p.secondaryCtaText && (
            <a href={p.secondaryCtaUrl || '#'} className="inline-flex px-5 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-soft font-medium">
              {p.secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'split') {
    return wrap(
      <div className="px-8 py-16 flex flex-col md:flex-row md:items-center gap-8 max-w-5xl mx-auto">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-neutral-100">{p.title ?? 'Hero'}</h1>
          {p.subtitle && <p className="mt-4 text-neutral-600 dark:text-neutral-400">{p.subtitle}</p>}
          <div className="mt-6 flex gap-3 flex-wrap">
            {p.ctaText && (
              <a href={p.ctaUrl || '#'} className="inline-flex px-4 py-2 bg-brand-600 text-white rounded-soft text-sm font-medium">
                {p.ctaText}
              </a>
            )}
            {p.secondaryCtaText && (
              <a href={p.secondaryCtaUrl || '#'} className="inline-flex px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-soft text-sm font-medium">
                {p.secondaryCtaText}
              </a>
            )}
          </div>
        </div>
        {p.imageUrl && (
          <div className="flex-1 flex justify-center">
            <img src={p.imageUrl} alt="" className="rounded-soft-lg max-h-64 object-cover" />
          </div>
        )}
      </div>
    );
  }

  // centered (default)
  return wrap(
    <div className="px-8 py-16 text-center bg-neutral-50 dark:bg-neutral-900">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100">{p.title ?? 'Hero'}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">{p.subtitle}</p>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        {p.ctaText && (
          <a href={p.ctaUrl || '#'} className="inline-flex px-4 py-2 bg-brand-600 text-white rounded-soft text-sm font-medium">
            {p.ctaText}
          </a>
        )}
        {p.secondaryCtaText && (
          <a href={p.secondaryCtaUrl || '#'} className="inline-flex px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-soft text-sm font-medium">
            {p.secondaryCtaText}
          </a>
        )}
      </div>
    </div>
  );
}
