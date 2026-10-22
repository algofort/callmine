'use client';

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const APP_NAME = 'social-login';

/**
 * Initialise (or re-initialise) a dedicated Firebase app from the admin-provided
 * web config. A fixed-name app is used so that when the admin changes the config,
 * we detect the mismatch and re-create it instead of silently reusing a stale
 * app initialised earlier in the same SPA session (a common cause of
 * `auth/internal-error`).
 */
function appForConfig(config) {
    const existing = getApps().find((a) => a.name === APP_NAME);
    if (existing) {
        const same = JSON.stringify(existing.options) === JSON.stringify(config);
        if (same) return existing;
        deleteApp(existing); // config changed → drop the stale app and re-init below
    }
    return initializeApp(config, APP_NAME);
}

/** Map Firebase SDK error codes to actionable, human-readable messages. */
function friendlyMessage(err) {
    const code = err?.code || '';
    switch (code) {
        case 'auth/internal-error':
            return 'Google sign-in failed. In the Firebase project: enable the Google sign-in provider, add this site to Authorized domains, and make sure the Web API key is not restricted (Identity Toolkit API enabled).';
        case 'auth/operation-not-allowed':
            return 'Google sign-in is not enabled for this Firebase project. Enable it under Authentication → Sign-in method.';
        case 'auth/unauthorized-domain':
            return "This site's domain is not authorised in Firebase. Add it under Authentication → Settings → Authorized domains.";
        case 'auth/invalid-api-key':
            return 'The Firebase API key is invalid. Re-check the value in the admin Social Login settings.';
        case 'auth/popup-blocked':
            return 'The sign-in popup was blocked by the browser. Allow popups for this site and try again.';
        default:
            return err?.message || 'Google sign-in failed. Please try again.';
    }
}

/**
 * Run a Google sign-in popup and return the Firebase ID token to verify server-side.
 *
 * @param {{ apiKey: string, authDomain: string, projectId: string, appId: string, messagingSenderId?: string, storageBucket?: string }} config
 * @returns {Promise<string>} Firebase ID token
 */
export async function signInWithGoogle(config) {
    if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
        throw new Error('Firebase is not fully configured. Set the API key, auth domain, project ID and app ID in the admin panel.');
    }

    // Normalise a mistakenly pasted authDomain (e.g. with a scheme or trailing slash).
    const cleaned = {
        ...config,
        authDomain: String(config.authDomain).replace(/^https?:\/\//, '').replace(/\/+$/, ''),
    };

    const app = appForConfig(cleaned);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        return result.user.getIdToken();
    } catch (err) {
        // Preserve the code for callers that special-case cancellations.
        const wrapped = new Error(friendlyMessage(err));
        wrapped.code = err?.code;
        throw wrapped;
    }
}
