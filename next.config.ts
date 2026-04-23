import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "items.squareup.com" },
      { protocol: "https", hostname: "items.squareupsandbox.com" },
      { protocol: "https", hostname: "square-web-production-f.squarecdn.com" },
      {
        protocol: "https",
        hostname: "items-images-sandbox.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
