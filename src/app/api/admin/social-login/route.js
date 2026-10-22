import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate, validationError } from '@/lib/http';
import { SOCIAL_LOGIN_GROUP, SOCIAL_LOGIN_KEYS, setSystemSetting } from '@/lib/settings';

/** PUT /admin/social-login */
export const PUT = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.social-login.update', 'manage_settings');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), {
        social_login_enabled: ['required', 'boolean'],
        social_login_google_enabled: ['required', 'boolean'],
        firebase_api_key: ['nullable', 'string', 'max:255'],
        firebase_auth_domain: ['nullable', 'string', 'max:255'],
        firebase_project_id: ['nullable', 'string', 'max:255'],
        firebase_app_id: ['nullable', 'string', 'max:255'],
        firebase_messaging_sender_id: ['nullable', 'string', 'max:255'],
        firebase_storage_bucket: ['nullable', 'string', 'max:255'],
    });

    // Turning the feature on requires a complete Firebase web config.
    if (data.social_login_enabled) {
        for (const key of [
            'firebase_api_key',
            'firebase_auth_domain',
            'firebase_project_id',
            'firebase_app_id',
        ]) {
            if (String(data[key] ?? '').trim() === '') {
                return validationError({ [key]: ['This field is required to enable social login.'] });
            }
        }
    }

    for (const [key, fallback] of Object.entries(SOCIAL_LOGIN_KEYS)) {
        let value = data[key] ?? fallback;
        if (typeof value === 'boolean') value = value ? '1' : '0';
        await setSystemSetting(key, String(value), SOCIAL_LOGIN_GROUP);
    }

    return back({ success: 'Social login settings saved.' });
});
