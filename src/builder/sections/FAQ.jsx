'use client';

export default function FAQ({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
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
      <div className="max-w-2xl mx-auto">
        {p.heading && <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 text-center">{p.heading}</h2>}
        {p.subheading && <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-center">{p.subheading}</p>}
        <dl className="mt-10 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="border-b border-gray-200 dark:border-neutral-700 pb-4">
              <dt className="font-semibold text-gray-900 dark:text-neutral-100">{item.question}</dt>
              <dd className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
