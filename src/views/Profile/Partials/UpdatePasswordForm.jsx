'use client';

import { route } from '@/lib/route';
import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import { Button } from '@/components/ui';
import { Transition } from '@headlessui/react';
import { useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

const inputClass =
    'mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-brand-400 dark:focus:ring-brand-400';

export default function UpdatePasswordForm({ className = '', compact = false }) {
    const { t } = useTranslation();
    const tp = (key) => t(`client.profile.${key}`);
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            {!compact && (
                <header>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">{tp('section_password_title')}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_password_desc')}</p>
                </header>
            )}

            <form onSubmit={updatePassword} className={compact ? 'space-y-6' : 'mt-6 space-y-6'}>
                <div>
                    <InputLabel htmlFor="current_password" value={tp('current_password')} />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className={inputClass}
                        autoComplete="current-password"
                    />

                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value={tp('new_password')} />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className={inputClass}
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value={tp('confirm_password')} />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className={inputClass}
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" variant="primary" disabled={processing}>
                        {tp('save')}
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{tp('saved')}</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
