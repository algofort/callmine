'use client';

export default function Text({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
  const base = 'border-l-4 ' + (isSelected ? 'border-brand-500' : 'border-transparent');
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition ${base} px-8 py-6 bg-white dark:bg-neutral-900`}
      {...rest}
    >
      <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{p.content ?? 'Text'}</p>
    </div>
  );
}
