'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Toggle } from '@/components/ui';
import { useForm } from '@/lib/page-router';
import SetupGuide from '@/components/SetupGuide';

/**
 * Copyable read-only field for the app's webhook callback URL.
 */
function WebhookUrlField({ url }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    if (!url) return null;

    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Webhook URL</h4>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Add this URL as the webhook / callback endpoint in the gateway dashboard so subscription and payment
                events reach the app.
            </p>
            <div className="mt-2 flex items-stretch gap-2">
                <input
                    type="text"
                    readOnly
                    value={url}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono"
                />
                <Button type="button" variant="outline" size="sm" onClick={copy}>
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </div>
    );
}

/**
 * Renders one credential input driven by a catalog field definition.
 */
function CredentialField({ field, mode, value, onChange, error }) {
    const name = `${mode}_${field.key}`;
    return (
        <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
            </label>
            <input
                type={field.type === 'password' ? 'password' : 'text'}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                autoComplete="off"
                className={`mt-1 w-full rounded-soft border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    error
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-600'
                        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                } text-neutral-900 dark:text-neutral-100`}
            />
            {error && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
            {field.help && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{field.help}</p>}
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.show
 * @param {string|null} props.gatewayKey
 * @param {object|null} props.initialData
 * @param {boolean} props.loading
 * @param {string|null} props.error
 * @param {Record<string, string>} props.validationErrors
 * @param {() => void} props.onClose
 * @param {() => void} props.onSaved
 * @param {(key: string) => string} props.buildShowUrl
 * @param {(key: string) => string} props.buildUpdateUrl
 * @param {string} [props.enableDescription]
 */
export default function PaymentGatewayEditModal({
    show,
    gatewayKey,
    initialData,
    loading,
    error,
    validationErrors = {},
    onClose,
    onSaved,
    buildUpdateUrl,
    enableDescription,
}) {
    const { data, setData, put, processing } = useForm({ test_mode: true, enabled: false });

    useEffect(() => {
        if (!initialData || initialData.gateway !== gatewayKey) return;
        const next = { test_mode: initialData.test_mode, enabled: initialData.enabled };
        for (const f of initialData.fields ?? []) {
            next[`test_${f.key}`] = initialData.test?.[f.key] ?? '';
            next[`live_${f.key}`] = initialData.live?.[f.key] ?? '';
        }
        setData(next);
    }, [gatewayKey, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(buildUpdateUrl(gatewayKey), {
            preserveScroll: true,
            onSuccess: () => onSaved(),
        });
    };

    const fields = initialData?.fields ?? [];
    const enableHelp = enableDescription ?? 'Make this gateway available to clients for subscription payments.';

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <Modal.Header title="Edit Payment Gateway" onClose={onClose} />
            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-6">
                    <SetupGuide guide={gatewayKey} />
                    {loading && (
                        <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">Loading…</div>
                    )}
                    {error && (
                        <div className="rounded-soft-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200">
                            {error}
                        </div>
                    )}
                    {!loading && initialData && (
                        <>
                            <WebhookUrlField url={initialData.webhook_url} />

                            {initialData.recurring === false && (
                                <div className="rounded-soft-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
                                    This gateway charges a single billing period (no automatic recurring renewal).
                                    Customers are billed once per checkout.
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Test Mode</h4>
                                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                    Using sandbox/test credentials for development and testing.
                                </p>
                                <Toggle
                                    checked={data.test_mode}
                                    onChange={(v) => setData('test_mode', v)}
                                    label={data.test_mode ? 'On' : 'Off'}
                                    className="mt-2"
                                />
                            </div>

                            {['test', 'live'].map((mode) => (
                                <div key={mode}>
                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                                        {mode} credentials
                                    </h4>
                                    <div className="mt-3 space-y-3">
                                        {fields.map((f) => (
                                            <CredentialField
                                                key={`${mode}_${f.key}`}
                                                field={f}
                                                mode={mode}
                                                value={data[`${mode}_${f.key}`] ?? ''}
                                                onChange={setData}
                                                error={validationErrors[`${mode}_${f.key}`]}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="rounded-soft-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> Both test and live credentials are stored securely (encrypted).
                                The active set is chosen by the Test Mode toggle above. Leave a secret field blank to keep
                                the stored value.
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Enable Gateway</h4>
                                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{enableHelp}</p>
                                <Toggle
                                    checked={data.enabled}
                                    onChange={(v) => setData('enabled', v)}
                                    label={data.enabled ? 'Enabled' : 'Disabled'}
                                    className="mt-2"
                                />
                            </div>
                        </>
                    )}
                </Modal.Body>
                {!loading && initialData && (
                    <Modal.Footer>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={processing}>
                            Update Gateway
                        </Button>
                    </Modal.Footer>
                )}
            </form>
        </Modal>
    );
}
