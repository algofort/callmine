'use client';

import { route } from '@/lib/route';
import { Head, Link, router, useForm, usePage } from '@/lib/page-router';
import { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebaseAuth';
import AuthShell, { AuthField, GoogleButton, OrDivider, SubmitButton, DemoLoginCard } from '@/components/auth/Auth';

export default function Login({ status, canResetPassword }) {
    const { props } = usePage();
    const brand = props.branding?.company_name || props.branding?.system_title || 'CallMineAI';
    const logoUrl = props.branding?.site_logo_url ?? null;

    const socialLogin = props.socialLogin ?? {};
    const showGoogle = Boolean(socialLogin.enabled && socialLogin.google);

    const demoCred = props.demo_mode ? props.demo_credentials?.client : null;

    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState('');
    const [demoLoading, setDemoLoading] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const oneClickLogin = () => {
        if (!demoCred) return;
        setData({ email: demoCred.email, password: demoCred.password, remember: true });
        router.post(route('login'), { email: demoCred.email, password: demoCred.password, remember: true }, {
            onStart: () => setDemoLoading(true),
            onFinish: () => setDemoLoading(false),
        });
    };

    const loginWithGoogle = async () => {
        setGoogleError('');
        setGoogleLoading(true);
        try {
            const idToken = await signInWithGoogle(socialLogin.firebase);
            router.post(route('auth.firebase.callback'), { id_token: idToken }, {
                onError: (errs) => setGoogleError(errs.social_login || 'Google sign-in failed. Please try again.'),
                onFinish: () => setGoogleLoading(false),
            });
        } catch (e) {
            const code = e?.code || '';
            if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
                setGoogleError(e?.message || 'Google sign-in failed.');
            }
            setGoogleLoading(false);
        }
    };

    return (
        <AuthShell
            brand={brand}
            logoUrl={logoUrl}
            eyebrow="Welcome back"
            title="Sign in to your workspace"
            subtitle="Pick up where you left off — your agents are ready."
            footer={<>Don&apos;t have an account? <Link href={route('register')} className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Create one</Link></>}
        >
            <Head title="Login" />

            {status && (
                <div className="mb-5 rounded-xl border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-sm font-medium text-signal-700 dark:text-signal-200">{status}</div>
            )}

            <DemoLoginCard cred={demoCred} onOneClick={oneClickLogin} loading={demoLoading} />

            {showGoogle && (
                <div className="mb-2">
                    <GoogleButton onClick={loginWithGoogle} loading={googleLoading} label="Sign in with Google" />
                    {googleError && <p className="mt-2 text-sm text-hot">{googleError}</p>}
                    <OrDivider />
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <AuthField id="email" label="Email address" type="email" name="email" autoComplete="username" autoFocus required
                    value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />

                <AuthField id="password" label="Password" secret name="password" autoComplete="current-password" required
                    value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />

                <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 bg-white dark:border-white/20 dark:bg-white/5 text-brand-600 focus:ring-brand-500/40" />
                        Remember me
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="text-sm font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Forgot password?</Link>
                    )}
                </div>

                <div className="pt-2">
                    <SubmitButton processing={processing} loadingText="Signing in…">Sign in</SubmitButton>
                </div>
            </form>
        </AuthShell>
    );
}
