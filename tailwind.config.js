import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './src/**/*.{js,jsx,mjs}',
        
    ],

    theme: {
        extend: {
            fontFamily: {
                display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            // Brand & neutrals — CallMineAI: iris (brand) + electric "signal" + ink shell
            colors: {
                white: '#F7F7FB',
                black: '#0c0c1c',
                // Iris / violet — primary, AI intelligence
                brand: {
                    50: '#f1eefe',
                    100: '#e4ddfd',
                    200: '#cabbfb',
                    300: '#a890f7',
                    400: '#8a67f2',
                    500: '#6d3fea',
                    600: '#5a28d6',
                    700: '#4a1fb0',
                    800: '#3c1c8c',
                    900: '#321a71',
                    950: '#1f0f4a',
                },
                // Electric teal — "live call / connected", pulses
                signal: {
                    50: '#e6fff7',
                    100: '#c2fdec',
                    200: '#86f9d8',
                    300: '#45edc1',
                    400: '#16d9a8',
                    500: '#06b88c',
                    600: '#039372',
                    700: '#04765d',
                    800: '#085d4b',
                    900: '#0a4d3f',
                    950: '#00302a',
                },
                // Ink — sidebar / dark surfaces (cool near-black, violet tint)
                ink: {
                    50: '#f6f6fa',
                    100: '#ececf3',
                    200: '#d6d6e3',
                    300: '#b2b2c9',
                    400: '#8888a8',
                    500: '#666688',
                    600: '#4d4d6b',
                    700: '#3a3a54',
                    800: '#222238',
                    900: '#15152a',
                    950: '#0c0c1c',
                },
                // Lead-temperature semantics (fixed)
                hot: '#fb5e5e',
                warm: '#ffb23e',
                cold: '#4fb0ff',
                // Backwards-compat alias used by some existing components
                secondary: {
                    50: '#f1eefe',
                    100: '#e4ddfd',
                    200: '#cabbfb',
                    300: '#a890f7',
                    400: '#8a67f2',
                    500: '#6d3fea',
                    600: '#5a28d6',
                    700: '#4a1fb0',
                    800: '#3c1c8c',
                    900: '#321a71',
                    950: '#1f0f4a',
                },
                neutral: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#0a0a0b',
                },
            },
            // Soft borders
            borderWidth: {
                soft: '1px',
            },
            borderColor: {
                DEFAULT: 'rgb(228 228 231 / 0.8)',
                soft: 'rgb(228 228 231 / 0.6)',
                muted: 'rgb(228 228 231 / 0.4)',
            },
            borderRadius: {
                soft: '0.5rem',
                'soft-lg': '0.75rem',
                'soft-xl': '1rem',
            },
            // Subtle shadows
            boxShadow: {
                soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
                'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
                'soft-xl': '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
                inner: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.04)',
            },
            // Spacing scale (align with design)
            spacing: {
                '4.5': '1.125rem',
                '13': '3.25rem',
                '15': '3.75rem',
                '18': '4.5rem',
                '22': '5.5rem',
                '30': '7.5rem',
            },
            transitionDuration: {
                150: '150ms',
                250: '250ms',
            },
            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            animation: {
                float: 'float 3s ease-in-out infinite',
                'float-slow': 'float 4s ease-in-out infinite',
                'float-delayed': 'float 3.5s ease-in-out infinite 0.8s',
                marquee: 'marquee 30s linear infinite',
                'pulse-signal': 'pulse-signal 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                // Live-call indicator: pulsing teal halo
                'pulse-signal': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgb(22 217 168 / 0.5)' },
                    '50%': { boxShadow: '0 0 0 6px rgb(22 217 168 / 0)' },
                },
            },
        },
    },

    plugins: [forms],
};
