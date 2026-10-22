'use client';

const ICONS = {
  star: '★',
  bolt: '⚡',
  heart: '♥',
  check: '✓',
  box: '☐',
};

export default function Features({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
  const items = p.items || [];
  const base = 'border-l-4 ' + (isSelected ? 'border-brand-500' : 'border-transparent');
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition ${base} px-8 py-12 bg-white dark:bg-neutral-900`}
      {...rest}
    >
      <div className="max-w-4xl mx-auto text-center">
        {p.heading && <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{p.heading}</h2>}
        {p.subheading && <p className="mt-2 text-neutral-600 dark:text-neutral-400">{p.subheading}</p>}
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-xl">
                {ICONS[item.icon] ?? '•'}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-neutral-100">{item.title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
