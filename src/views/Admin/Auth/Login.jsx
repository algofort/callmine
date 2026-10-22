'use client';

import { route } from '@/lib/route';
import { Head, Link, router, useForm, usePage } from '@/lib/page-router';
import { useState } from 'react';
import AuthShell, { AuthField, SubmitButton, DemoLoginCard } from '@/components/auth/Auth';

export default function AdminLogin({ status, error }) {
    const { props } = usePage();
    const brand = props.branding?.company_name || props.branding?.system_title || 'CallMineAI';
    const logoUrl = props.branding?.site_logo_url ?? null;

    const demoCred = props.demo_mode ? props.demo_credentials?.admin : null;
    const [demoLoading, setDemoLoading] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.login'), { onFinish: () => reset('password') });
    };

    const oneClickLogin = () => {
        if (!demoCred) return;
        setData({ email: demoCred.email, password: demoCred.password, remember: true });
        router.post(route('admin.login'), { email: demoCred.email, password: demoCred.password, remember: true }, {
            onStart: () => setDemoLoading(true),
            onFinish: () => setDemoLoading(false),
        });
    };

    return (
        <AuthShell
            brand={brand}
            logoUrl={logoUrl}
            variant="admin"
            eyebrow="Admin sign in"
            title="Sign in to the control panel"
            subtitle="Manage the whole platform from one secure console."
            footer={<>Not an admin? <Link href={route('login')} className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Client login</Link></>}
        >
            <Head title="Admin sign in" />

            {status && (
                <div className="mb-5 rounded-xl border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-sm font-medium text-signal-700 dark:text-signal-200">{status}</div>
            )}
            {error && (
                <div className="mb-5 rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm font-medium text-hot">{error}</div>
            )}

            <DemoLoginCard cred={demoCred} onOneClick={oneClickLogin} loading={demoLoading} hint="Sign in as demo admin" />

            <form onSubmit={submit} className="space-y-4">
                <AuthField id="email" label="Email address" type="email" name="email" autoComplete="username" autoFocus required
                    value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />

                <AuthField id="password" label="Password" secret name="password" autoComplete="current-password" required
                    value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />

                <div className="flex items-center pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <input type="checkbox" name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 bg-white dark:border-white/20 dark:bg-white/5 text-brand-600 focus:ring-brand-500/40" />
                        Remember me
                    </label>
                </div>

                <div className="pt-2">
                    <SubmitButton processing={processing} loadingText="Signing in…">Sign in</SubmitButton>
                </div>
            </form>
        </AuthShell>
    );
}
