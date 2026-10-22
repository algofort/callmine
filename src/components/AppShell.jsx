'use client';

import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '@/i18n';
import { PageProvider, RouterBridge } from '@/lib/page-router';
import { ThemeProvider } from '@/context/ThemeContext';
import LocaleSync from '@/components/LocaleSync';

/**
 * Client boundary for every page — mounts the shared providers around
 * setup(): install page props, i18n, theme and the router bridge, then render
 * the ported page component with its props.
 */
export default function AppShell({ shared, props, component, url, children }) {
    // Run once per browser session, before the first render.
    useState(() => {
        if (!i18n.isInitialized) initI18n();
        const bundle = shared?.i18n;
        if (bundle?.locale && bundle?.translations && typeof i18n.addResourceBundle === 'function') {
            i18n.addResourceBundle(bundle.locale, 'translation', bundle.translations, true, true);
            if (i18n.language !== bundle.locale) i18n.changeLanguage(bundle.locale);
        }
        return true;
    });

    return (
        <I18nextProvider i18n={i18n}>
            <PageProvider shared={shared} props={props} component={component} url={url}>
                <ThemeProvider>
                    <RouterBridge />
                    <LocaleSync />
                    {children}
                </ThemeProvider>
            </PageProvider>
        </I18nextProvider>
    );
}
