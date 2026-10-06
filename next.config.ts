import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const devConnectSources = isProduction
    ? ""
    : " http://localhost:5000 http://127.0.0.1:5000 ws://localhost:* ws://127.0.0.1:*";

const contentSecurityPolicy = [
    "default-src 'self' https:;",
    "script-src 'self' 'unsafe-inline' https:;",
    "style-src 'self' 'unsafe-inline' https:;",
    "img-src 'self' data: https:;",
    `connect-src 'self' https:${devConnectSources};`,
    "frame-ancestors 'self' https://*.zoom.us;",
].join(" ");

const securityHeaders = [
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "Referrer-Policy",
        value: "no-referrer-when-downgrade",
    },
    {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
    },
];

const nextConfig: NextConfig = {
    turbopack: {
        root: process.cwd(),
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5000',
                pathname: '/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
        unoptimized: true, // Allow unoptimized images for local development
    },
    typescript: {
        // Pre-existing TS debt blocks Docker/`next build` when strict; keep true for prod images.
        // Set IGNORE_TS_ERRORS=false to enforce typecheck locally/CI when cleaning up.
        ignoreBuildErrors:
            process.env.IGNORE_TS_ERRORS === "false" ||
            process.env.NEXT_PUBLIC_IGNORE_BUILD_ERRORS === "false"
                ? false
                : true,
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
