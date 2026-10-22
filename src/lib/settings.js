import 'server-only';

import prisma from '@/lib/prisma';
import config from '@/lib/config';

/* --------------------------------------------------------- SystemSetting */

export async function systemSetting(key, fallback = null) {
    try {
        const row = await prisma.systemSetting.findFirst({ where: { key } });
        return row?.value ?? fallback;
    } catch {
        return fallback;
    }
}

export async function setSystemSetting(key, value, group = 'general') {
    const existing = await prisma.systemSetting.findFirst({ where: { key } });
    if (existing) {
        return prisma.systemSetting.update({
            where: { id: existing.id },
            data: { value: value === null ? null : String(value), updated_at: new Date() },
        });
    }
    return prisma.systemSetting.create({
        data: {
            key,
            value: value === null ? null : String(value),
            group,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

export async function systemSettingsByGroup(group) {
    const rows = await prisma.systemSetting.findMany({ where: { group } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/* -------------------------------------------------------- GeneralSetting */

export const DEFAULT_BRANDING = {
    system_title: config.app.name,
    company_name: '',
    tagline: '',
    email: '',
    primary_color: '#0284c7',
    favicon_url: null,
    site_logo_url: null,
    updated_at: null,
};

export async function generalSettings() {
    try {
        const row = await prisma.generalSetting.findFirst();
        if (row) return row;
        return await prisma.generalSetting.create({
            data: {
                system_title: config.app.name,
                company_name: '',
                primary_color: '#0284c7',
                timezone: 'UTC',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    } catch {
        return null;
    }
}

/** The `branding` shared prop. */
export async function brandingPayload() {
    let row = null;
    try {
        row = await prisma.generalSetting.findFirst();
    } catch {
        return DEFAULT_BRANDING;
    }
    if (!row) return DEFAULT_BRANDING;

    return {
        system_title: String(row.system_title || config.app.name),
        company_name: String(row.company_name ?? ''),
        tagline: row.tagline ? String(row.tagline) : '',
        email: String(row.email ?? ''),
        primary_color: String(row.primary_color ?? '#0284c7'),
        favicon_url: row.favicon_path ? assetUrl(row.favicon_path) : null,
        site_logo_url: row.site_logo_path ? assetUrl(row.site_logo_path) : null,
        updated_at: row.updated_at ? Math.floor(new Date(row.updated_at).getTime() / 1000) : null,
    };
}

/** Uploads are served from /storage/*. */
export function assetUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `/storage/${String(path).replace(/^\/+/, '')}`;
}

/* ---------------------------------------------------- SocialLoginSettings */

export const SOCIAL_LOGIN_GROUP = 'social_login';

export const SOCIAL_LOGIN_KEYS = {
    social_login_enabled: '0',
    social_login_google_enabled: '1',
    firebase_api_key: '',
    firebase_auth_domain: '',
    firebase_project_id: '',
    firebase_app_id: '',
    firebase_messaging_sender_id: '',
    firebase_storage_bucket: '',
};

const truthy = (v) => ['1', 'true', 'on', 'yes'].includes(String(v ?? '').toLowerCase());

export async function socialLoginAll() {
    const stored = await systemSettingsByGroup(SOCIAL_LOGIN_GROUP).catch(() => ({}));
    const out = {};
    for (const [key, fallback] of Object.entries(SOCIAL_LOGIN_KEYS)) {
        out[key] = String(stored[key] ?? fallback);
    }
    return out;
}

export async function socialLoginPayload() {
    const all = await socialLoginAll();
    const configured = ['firebase_api_key', 'firebase_auth_domain', 'firebase_project_id', 'firebase_app_id'].every(
        (k) => String(all[k] ?? '').trim() !== '',
    );
    const enabled = truthy(all.social_login_enabled) && configured;

    return {
        enabled,
        google: enabled && truthy(all.social_login_google_enabled),
        firebase: enabled
            ? {
                  apiKey: all.firebase_api_key,
                  authDomain: all.firebase_auth_domain,
                  projectId: all.firebase_project_id,
                  appId: all.firebase_app_id,
                  messagingSenderId: all.firebase_messaging_sender_id,
                  storageBucket: all.firebase_storage_bucket,
              }
            : {},
    };
}
