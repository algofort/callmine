'use client';

/**
 * Default props and field definitions for each section type.
 * Used by PropertyPanel for editing and by section components for defaults.
 */
export const SECTION_SCHEMAS = {
  hero: {
    variants: ['centered', 'split', 'minimal'],
    defaultProps: {
      variant: 'centered',
      title: 'Welcome',
      subtitle: 'Edit this section in the panel.',
      ctaText: 'Get started',
      ctaUrl: '#',
      imageUrl: '',
      secondaryCtaText: '',
      secondaryCtaUrl: '',
    },
    fields: [
      { key: 'variant', label: 'Variant', type: 'select', options: [
        { value: 'centered', label: 'Centered' },
        { value: 'split', label: 'Split' },
        { value: 'minimal', label: 'Minimal' },
      ]},
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'ctaText', label: 'Button text', type: 'text' },
      { key: 'ctaUrl', label: 'Button URL', type: 'text' },
      { key: 'secondaryCtaText', label: 'Secondary button text', type: 'text' },
      { key: 'secondaryCtaUrl', label: 'Secondary button URL', type: 'text' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
    ],
  },
  features: {
    defaultProps: {
      heading: 'Features',
      subheading: 'What we offer',
      items: [
        { title: 'Feature one', description: 'Short description.', icon: 'star' },
        { title: 'Feature two', description: 'Short description.', icon: 'bolt' },
        { title: 'Feature three', description: 'Short description.', icon: 'heart' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'items', label: 'Features', type: 'featuresList' },
    ],
  },
  services: {
    defaultProps: {
      heading: 'Our Services',
      subheading: 'What we do for you',
      items: [
        { title: 'Service one', description: 'Description here.' },
        { title: 'Service two', description: 'Description here.' },
        { title: 'Service three', description: 'Description here.' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'items', label: 'Services', type: 'servicesList' },
    ],
  },
  pricing: {
    defaultProps: {
      heading: 'Pricing',
      subheading: 'Choose your plan',
      plans: [
        { name: 'Starter', price: '$9', period: '/mo', features: ['Feature A', 'Feature B'], cta: 'Get started', highlighted: false },
        { name: 'Pro', price: '$29', period: '/mo', features: ['Everything in Starter', 'Feature C'], cta: 'Get started', highlighted: true },
        { name: 'Enterprise', price: '$99', period: '/mo', features: ['Everything in Pro', 'Support'], cta: 'Contact', highlighted: false },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'plans', label: 'Plans', type: 'pricingList' },
    ],
  },
  testimonials: {
    defaultProps: {
      heading: 'Testimonials',
      subheading: 'What people say',
      items: [
        { quote: 'Great product!', author: 'Jane Doe', role: 'Customer' },
        { quote: 'Highly recommend.', author: 'John Smith', role: 'User' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'items', label: 'Testimonials', type: 'testimonialsList' },
    ],
  },
  faq: {
    defaultProps: {
      heading: 'FAQ',
      subheading: 'Common questions',
      items: [
        { question: 'How does it work?', answer: 'It works great.' },
        { question: 'What is included?', answer: 'Everything you need.' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'items', label: 'Questions', type: 'faqList' },
    ],
  },
  contact: {
    defaultProps: {
      heading: 'Get in touch',
      subheading: 'We’d love to hear from you',
      email: 'hello@example.com',
      phone: '',
      address: '',
      showForm: true,
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'showForm', label: 'Show contact form', type: 'checkbox' },
    ],
  },
  text: {
    defaultProps: { content: 'Add your content here.' },
    fields: [
      { key: 'content', label: 'Content', type: 'textarea' },
    ],
  },
};

/** Default section payload for add section (id filled in by editor). */
export function getDefaultSection(type, id) {
  const schema = SECTION_SCHEMAS[type];
  if (!schema) return { id, type: 'block', props: {}, style: {} };
  return {
    id,
    type,
    props: { ...schema.defaultProps },
    style: {},
  };
}

export const SECTION_TYPES = Object.keys(SECTION_SCHEMAS);
