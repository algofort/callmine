'use client';

import { route } from '@/lib/route';
import { Head, Link, router, useForm, usePage } from '@/lib/page-router';
import { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebaseAuth';
import AuthShell, { AuthField, GoogleButton, OrDivider, SubmitButton } from '@/components/auth/Auth';

export default function Register() {
    const { props } = usePage();
    const brand = props.branding?.company_name || props.branding?.system_title || 'CallMineAI';
    const logoUrl = props.branding?.site_logo_url ?? null;

    const socialLogin = props.socialLogin ?? {};
    const showGoogle = Boolean(socialLogin.enabled && socialLogin.google);

    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const registerWithGoogle = async () => {
        setGoogleError('');
        setGoogleLoading(true);
        try {
            const idToken = await signInWithGoogle(socialLogin.firebase);
            router.post(route('auth.firebase.callback'), { id_token: idToken }, {
                onError: (errs) => setGoogleError(errs.social_login || 'Google sign-up failed. Please try again.'),
                onFinish: () => setGoogleLoading(false),
            });
        } catch (e) {
            const code = e?.code || '';
            if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
                setGoogleError(e?.message || 'Google sign-up failed.');
            }
            setGoogleLoading(false);
        }
    };

    return (
        <AuthShell
            brand={brand}
            logoUrl={logoUrl}
            eyebrow="Get started free"
            title="Create your account"
            subtitle="Deploy your first AI caller in minutes — no credit card needed."
            footer={<>Already have an account? <Link href={route('login')} className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Sign in</Link></>}
        >
            <Head title="Create account" />

            {showGoogle && (
                <div className="mb-2">
                    <GoogleButton onClick={registerWithGoogle} loading={googleLoading} label="Sign up with Google" />
                    {googleError && <p className="mt-2 text-sm text-hot">{googleError}</p>}
                    <OrDivider />
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <AuthField id="name" label="Full name" name="name" autoComplete="name" autoFocus required
                    value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />

                <AuthField id="email" label="Email address" type="email" name="email" autoComplete="username" required
                    value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />

                <AuthField id="password" label="Password" secret name="password" autoComplete="new-password" required
                    value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />

                <AuthField id="password_confirmation" label="Confirm password" secret name="password_confirmation" autoComplete="new-password" required
                    value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} error={errors.password_confirmation} />

                <div className="pt-2">
                    <SubmitButton processing={processing} loadingText="Creating account…">Create account</SubmitButton>
                </div>
            </form>

            <p className="mt-4 text-center font-mono text-[11px] text-neutral-500 dark:text-neutral-600">
                By continuing you agree to our{' '}
                <Link href={route('frontend.terms')} className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">Terms</Link> &{' '}
                <Link href={route('frontend.privacy')} className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">Privacy</Link>.
            </p>
        </AuthShell>
    );
}
