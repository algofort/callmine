'use client';

export default function Services({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
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
        <ul className="mt-10 space-y-6">
          {items.map((item, i) => (
            <li key={i} className="flex gap-4 p-4 rounded-soft bg-neutral-50 dark:bg-neutral-800">
              <div className="shrink-0 h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-neutral-100">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
