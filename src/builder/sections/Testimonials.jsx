'use client';

export default function Testimonials({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
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
      <div className="max-w-4xl mx-auto">
        {p.heading && <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 text-center">{p.heading}</h2>}
        {p.subheading && <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-center">{p.subheading}</p>}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {items.map((item, i) => (
            <blockquote key={i} className="rounded-soft-lg border border-gray-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-6">
              <p className="text-gray-700 dark:text-neutral-300">"{item.quote}"</p>
              <footer className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                — {item.author}
                {item.role && <span>, {item.role}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
