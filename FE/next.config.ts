import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.vietqr.io',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const proxyTarget =
      process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL;
    if (!proxyTarget) {
      return [];
    }

    const base = proxyTarget.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${base}/:path*`,
      },
    ];
  },
};

export default nextConfig;
