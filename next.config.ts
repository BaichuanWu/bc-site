import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: false, // 必须为 false
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  experimental: {
    proxyTimeout: 1000 * 120,
  },
};

export default nextConfig;
