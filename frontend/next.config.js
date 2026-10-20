/** @type {import('next').NextConfig} */

// Target for the transparent `/api/*` proxy. The frontend defaults to
// same-origin `/api` (see src/lib/env.ts), so a fresh clone works without
// any env config as long as the Spring Boot backend runs locally.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:8080';

const nextConfig = {
  // Lint failures must fail the deployment build: a clean `npm run lint`
  // is enforced in CI/local before build, so this is not disabled.
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
