'use client';

export default function Pricing({ props: p = {}, style = {}, isSelected, onSelect, ...rest }) {
  const plans = p.plans || [];
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
      <div className="max-w-4xl mx-auto">
        {p.heading && <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 text-center">{p.heading}</h2>}
        {p.subheading && <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-center">{p.subheading}</p>}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-soft-lg border-2 p-6 ${plan.highlighted ? 'border-brand-500 bg-white dark:bg-neutral-900 shadow-soft dark:shadow-none' : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'}`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-neutral-100">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {plan.price}
                <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">{plan.period}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                {(plan.features || []).map((f, j) => (
                  <li key={j}>• {f}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 w-full py-2 rounded-soft text-sm font-medium ${plan.highlighted ? 'bg-brand-600 text-white' : 'border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300'}`}
              >
                {plan.cta || 'Get started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
