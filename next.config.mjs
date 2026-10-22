/** @type {import('next').NextConfig} */
const nextConfig = {
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
