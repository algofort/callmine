// Next compiles this into the browser bundle; changing it requires a rebuild.
const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? (configuredUrl ? new URL(configuredUrl).pathname : '')).replace(/\/+$/, '');
if (basePath && (!basePath.startsWith('/') || basePath.startsWith('//') || /[?#]/.test(basePath))) {
    throw new Error('NEXT_PUBLIC_BASE_PATH must be empty or a pathname such as /callmine.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath,
    reactStrictMode: false,
    poweredByHeader: false,
    eslint: { ignoreDuringBuilds: true },
    serverExternalPackages: ['@prisma/client', 'bcryptjs', 'nodemailer'],
    async headers() {
        // Mirrors App\Http\Middleware\SecureHeaders.
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-XSS-Protection', value: '0' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(self), geolocation=()',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
