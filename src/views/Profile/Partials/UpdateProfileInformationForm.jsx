'use client';

import { route } from '@/lib/route';
import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import { Button } from '@/components/ui';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';

const inputClass =
    'mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-brand-400 dark:focus:ring-brand-400';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
    compact = false,
}) {
    const { t } = useTranslation();
    const user = usePage().props.auth.user;
    const tp = (key) => t(`client.profile.${key}`);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('client.profile.update'));
    };

    return (
        <section className={className}>
            {!compact && (
                <header>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">{tp('section_information_title')}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_information_desc')}</p>
                </header>
            )}

            <form onSubmit={submit} className={compact ? 'space-y-6' : 'mt-6 space-y-6'}>
                <div>
                    <InputLabel htmlFor="name" value={tp('name')} />

                    <TextInput
                        id="name"
                        className={inputClass}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value={tp('email')} />

                    <TextInput
                        id="email"
                        type="email"
                        className={inputClass}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-200">
                            {tp('unverified_email')}{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm font-medium text-brand-600 underline decoration-brand-600/70 underline-offset-2 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                            >
                                {tp('resend_verification')}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                {tp('verification_sent')}
                            </div>
                        )}
                    </div>
                )}

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
