'use client';

import { route } from '@/lib/route';
import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';

const inputClass =
    'mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-brand-400 dark:focus:ring-brand-400';

export default function DeleteUserForm({ className = '', compact = false }) {
    const { t } = useTranslation();
    const tp = (key) => t(`client.profile.${key}`);
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('client.profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            {!compact && (
                <header>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">{tp('section_delete_title')}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_delete_desc')}</p>
                </header>
            )}

            <Button type="button" variant="danger" onClick={confirmUserDeletion}>
                {tp('delete_account')}
            </Button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">{tp('delete_confirm_title')}</h2>

                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{tp('delete_confirm_desc')}</p>

                    <div className="mt-6">
                        <InputLabel htmlFor="password" value={tp('password_placeholder')} className="sr-only" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={`${inputClass} max-w-md`}
                            isFocused
                            placeholder={tp('password_placeholder')}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            {tp('cancel')}
                        </Button>

                        <Button type="submit" variant="danger" disabled={processing}>
                            {tp('delete_account')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
