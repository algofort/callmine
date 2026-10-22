'use client';

import { route } from '@/lib/route';
import { useForm } from '@/lib/page-router';
import { Modal } from '@/components/ui';
import PlanForm from './PlanForm';

const emptyPlan = () => ({
    name: '',
    slug: '',
    description: '',
    currency_code: 'USD',
    monthly_price_cents: null,
    yearly_price_cents: null,
    trial_days: 0,
    stripe_monthly_id: '',
    stripe_yearly_id: '',
    features: [],
    limits: {},
    enabled: true,
    featured: false,
    popular: false,
    sort_order: 0,
});

export default function PlanModal({ show, onClose, plan = null }) {
    const isEdit = !!plan?.id;

    const { data, setData, post, put, processing, errors, reset } = useForm(
        plan ? { ...plan, limits: plan.limits ?? {}, features: plan.features ?? [] } : emptyPlan()
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.plans.update', plan.id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('admin.plans.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <Modal.Header
                title={isEdit ? 'Edit Plan' : 'Add Plan'}
                onClose={onClose}
            />
            <Modal.Body className="max-h-[70vh] overflow-y-auto">
                <PlanForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isEdit={isEdit}
                />
            </Modal.Body>
        </Modal>
    );
}
