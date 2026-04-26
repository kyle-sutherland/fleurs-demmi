import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // Square Web Payments SDK + iframes
      "script-src 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "frame-src https://sandbox.web.squarecdn.com https://web.squarecdn.com https://challenges.cloudflare.com",
      // Turnstile widget script
      "script-src-elem 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com https://web.squarecdn.com https://challenges.cloudflare.com",
      // Square CDN images + self
      "img-src 'self' data: https://items.squareup.com https://items.squareupsandbox.com https://square-web-production-f.squarecdn.com https://items-images-sandbox.s3.us-west-2.amazonaws.com https://items-images-production.s3.us-west-2.amazonaws.com",
      "connect-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' https://fonts.gstatic.com",
    ].join("; "),
  },
];

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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
