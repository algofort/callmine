import './globals.css';
import '@xyflow/react/dist/style.css';

import config from '@/lib/config';
import RouteProgress from '@/components/RouteProgress';

export const metadata = {
    title: config.app.name,
    description: 'AI voice calling platform',
};

export const viewport = {
    themeColor: '#6d3fea',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
                {/* Apply the stored theme before paint so dark mode does not flash. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
                    }}
                />
            </head>
            <body className="font-sans antialiased">
                <RouteProgress />
                {children}
            </body>
        </html>
    );
}
