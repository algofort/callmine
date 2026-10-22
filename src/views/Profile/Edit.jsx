'use client';

import ClientLayout from '@/layouts/ClientLayout';
import { Head, usePage } from '@/lib/page-router';
import { useTranslation } from 'react-i18next';
import { KeyRound, Trash2, User } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { t } = useTranslation();
    const { flash = {} } = usePage().props;
    const tp = (key) => t(`client.profile.${key}`);

    return (
        <ClientLayout title={tp('page_title')}>
            <Head title={tp('page_title')} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {tp('page_title')}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {tp('page_subtitle')}
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
                        <User className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {tp('section_information_title')}
                    </h2>
                    <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_information_desc')}</p>
                    <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} compact />
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
                        <KeyRound className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {tp('section_password_title')}
                    </h2>
                    <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_password_desc')}</p>
                    <UpdatePasswordForm compact />
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
                        <Trash2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {tp('section_delete_title')}
                    </h2>
                    <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{tp('section_delete_desc')}</p>
                    <DeleteUserForm compact />
                </div>
            </div>
        </ClientLayout>
    );
}
