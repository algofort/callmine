'use client';

export default function Contact({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
  const base = 'border-l-4 ' + (isSelected ? 'border-brand-500' : 'border-transparent');
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition ${base} px-8 py-12 bg-neutral-50 dark:bg-neutral-900`}
      {...rest}
    >
      <div className="max-w-2xl mx-auto">
        {p.heading && <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 text-center">{p.heading}</h2>}
        {p.subheading && <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-center">{p.subheading}</p>}
        <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center flex-wrap">
          {p.email && (
            <a href={`mailto:${p.email}`} className="text-brand-600 dark:text-brand-400 font-medium">
              {p.email}
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`} className="text-gray-700 dark:text-neutral-300">{p.phone}</a>
          )}
          {p.address && <p className="text-neutral-600 dark:text-neutral-400">{p.address}</p>}
        </div>
        {p.showForm !== false && (
          <div className="mt-8 p-6 rounded-soft-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">Contact form placeholder (name, email, message)</p>
          </div>
        )}
      </div>
    </div>
  );
}
