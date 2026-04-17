import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'items.squareup.com' },
      { protocol: 'https', hostname: 'items.squareupsandbox.com' },
      { protocol: 'https', hostname: 'square-web-production-f.squarecdn.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
};

export default nextConfig;
