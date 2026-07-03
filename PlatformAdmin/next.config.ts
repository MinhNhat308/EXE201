import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const proxyTarget = process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!proxyTarget) {
      return [];
    }

    const base = proxyTarget.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/:path*`
      }
    ];
  }
};

export default nextConfig;
