'use client';

/**
 * Right-panel property editor for the selected section.
 * Renders fields from section schema (text, textarea, select, checkbox, list types).
 */
import React from 'react';
import { SECTION_SCHEMAS } from './sectionSchemas';
import { Button, Input } from '@/components/ui';

function FieldInput({ field, value, onChange }) {
  const v = value ?? '';
  if (field.type === 'textarea') {
    return (
      <textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-soft border border-neutral-300 px-3 py-2 text-sm"
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-soft border border-neutral-300 px-3 py-2 text-sm"
      >
        {(field.options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-neutral-300"
      />
    );
  }
  return (
    <input
      type="text"
      value={v}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-soft border border-neutral-300 px-3 py-2 text-sm"
    />
  );
}

function FeaturesListEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (index, key, val) => {
    const next = [...items];
    if (!next[index]) next[index] = { title: '', description: '', icon: 'star' };
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...items, { title: '', description: '', icon: 'star' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border border-neutral-200 rounded-soft space-y-2">
          <Input
            label="Title"
            value={item.title ?? ''}
            onChange={(e) => update(i, 'title', e.target.value)}
          />
          <Input
            label="Description"
            value={item.description ?? ''}
            onChange={(e) => update(i, 'description', e.target.value)}
          />
          <select
            value={item.icon ?? 'star'}
            onChange={(e) => update(i, 'icon', e.target.value)}
            className="w-full rounded-soft border border-neutral-300 px-2 py-1 text-sm"
          >
            {['star', 'bolt', 'heart', 'check', 'box'].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Add feature</Button>
    </div>
  );
}

function ServicesListEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (index, key, val) => {
    const next = [...items];
    if (!next[index]) next[index] = { title: '', description: '' };
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...items, { title: '', description: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border border-neutral-200 rounded-soft space-y-2">
          <Input label="Title" value={item.title ?? ''} onChange={(e) => update(i, 'title', e.target.value)} />
          <Input label="Description" value={item.description ?? ''} onChange={(e) => update(i, 'description', e.target.value)} />
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Add service</Button>
    </div>
  );
}

function PricingListEditor({ value = [], onChange }) {
  const plans = Array.isArray(value) ? value : [];
  const update = (index, key, val) => {
    const next = [...plans];
    if (!next[index]) next[index] = { name: '', price: '', period: '/mo', features: [], cta: 'Get started', highlighted: false };
    if (key === 'features') next[index] = { ...next[index], features: val };
    else if (key === 'highlighted') next[index] = { ...next[index], highlighted: !!val };
    else next[index] = { ...next[index], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...plans, { name: '', price: '$0', period: '/mo', features: [], cta: 'Get started', highlighted: false }]);
  const remove = (i) => onChange(plans.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {plans.map((plan, i) => (
        <div key={i} className="p-3 border border-neutral-200 rounded-soft space-y-2">
          <Input label="Plan name" value={plan.name ?? ''} onChange={(e) => update(i, 'name', e.target.value)} />
          <Input label="Price" value={plan.price ?? ''} onChange={(e) => update(i, 'price', e.target.value)} />
          <Input label="Period" value={plan.period ?? '/mo'} onChange={(e) => update(i, 'period', e.target.value)} />
          <div>
            <label className="text-sm font-medium text-neutral-700">Features (one per line)</label>
            <textarea
              value={(plan.features || []).join('\n')}
              onChange={(e) => update(i, 'features', e.target.value.split('\n').filter(Boolean))}
              rows={3}
              className="w-full rounded-soft border border-neutral-300 px-2 py-1 text-sm mt-1"
            />
          </div>
          <Input label="Button text" value={plan.cta ?? ''} onChange={(e) => update(i, 'cta', e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!plan.highlighted} onChange={(e) => update(i, 'highlighted', e.target.checked)} />
            <span className="text-sm">Highlighted</span>
          </label>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Add plan</Button>
    </div>
  );
}

function TestimonialsListEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (index, key, val) => {
    const next = [...items];
    if (!next[index]) next[index] = { quote: '', author: '', role: '' };
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...items, { quote: '', author: '', role: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border border-neutral-200 rounded-soft space-y-2">
          <div>
            <label className="text-sm font-medium text-neutral-700">Quote</label>
            <textarea value={item.quote ?? ''} onChange={(e) => update(i, 'quote', e.target.value)} rows={2} className="w-full rounded-soft border border-neutral-300 px-2 py-1 text-sm mt-1" />
          </div>
          <Input label="Author" value={item.author ?? ''} onChange={(e) => update(i, 'author', e.target.value)} />
          <Input label="Role" value={item.role ?? ''} onChange={(e) => update(i, 'role', e.target.value)} />
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Add testimonial</Button>
    </div>
  );
}

function FAQListEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (index, key, val) => {
    const next = [...items];
    if (!next[index]) next[index] = { question: '', answer: '' };
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...items, { question: '', answer: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border border-neutral-200 rounded-soft space-y-2">
          <Input label="Question" value={item.question ?? ''} onChange={(e) => update(i, 'question', e.target.value)} />
          <div>
            <label className="text-sm font-medium text-neutral-700">Answer</label>
            <textarea value={item.answer ?? ''} onChange={(e) => update(i, 'answer', e.target.value)} rows={2} className="w-full rounded-soft border border-neutral-300 px-2 py-1 text-sm mt-1" />
          </div>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Add question</Button>
    </div>
  );
}

const LIST_EDITORS = {
  featuresList: FeaturesListEditor,
  servicesList: ServicesListEditor,
  pricingList: PricingListEditor,
  testimonialsList: TestimonialsListEditor,
  faqList: FAQListEditor,
};

export default function PropertyPanel({ section, onUpdate, onRemove }) {
  if (!section) {
    return <p className="text-sm text-neutral-500">Select a section to edit its properties.</p>;
  }

  const schema = SECTION_SCHEMAS[section.type];
  const props = section.props || {};

  const setProp = (key, value) => {
    onUpdate({ props: { ...section.props, [key]: value } });
  };

  if (!schema) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-700">Unknown section type: {section.type}</p>
        <Button variant="ghost" size="sm" className="text-red-600" onClick={onRemove}>Remove section</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-neutral-700 capitalize">{section.type}</p>
      {(schema.fields || []).map((field) => {
        const ListEditor = LIST_EDITORS[field.type];
        return (
        <div key={field.key}>
          {ListEditor ? (
            <>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{field.label}</label>
              <ListEditor
                value={props[field.key]}
                onChange={(val) => setProp(field.key, val)}
              />
            </>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{field.label}</label>
              <FieldInput
                field={field}
                value={props[field.key]}
                onChange={(val) => setProp(field.key, val)}
              />
            </>
          )}
        </div>
      );
      })}
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={onRemove}>
        Remove section
      </Button>
    </div>
  );
}
