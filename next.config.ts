import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  compress: false, // 必须为 false
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production"
    const backendUrl = isProd ? "http://backend:8000" : "http://localhost:8000"
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`,
      },
    ]
  },
  experimental: {
    proxyTimeout: 1000 * 120,
  },
};

export default nextConfig;
