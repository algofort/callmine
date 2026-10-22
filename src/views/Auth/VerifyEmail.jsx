'use client';

import { route } from '@/lib/route';
import PrimaryButton from '@/components/PrimaryButton';
import GuestLayout from '@/layouts/GuestLayout';
import { Head, Link, useForm } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail({ status }) {
    const { t } = useTranslation();
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth.verify_email_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.verify_email_intro')}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t('auth.verification_sent')}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {t('auth.resend_verification')}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t('auth.log_out')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
