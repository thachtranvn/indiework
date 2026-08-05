import os from "node:os";
import type { NextConfig } from "next";

/** LAN + loopback hosts so a phone on Wi-Fi can load `/_next` and hydrate. */
function localDevOrigins(): string[] {
  const origins = new Set<string>(["127.0.0.1"]);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) origins.add(addr.address);
    }
  }
  return [...origins];
}

// Static security headers for every response. The Content-Security-Policy is
// NOT here — it carries a per-request nonce and is emitted by src/proxy.ts.
// `frame-ancestors 'none'` (in the CSP) is the modern clickjacking control;
// X-Frame-Options: DENY is kept as a fallback for older browsers.
const securityHeaders = [
  // Browsers ignore HSTS over plain HTTP, so it's safe to send unconditionally.
  // No `preload` — that's a heavy commitment (preload-list submission) we don't opt into.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Next 16 blocks cross-origin `/_next` in dev. Desktop `localhost` is fine;
  // a real phone hits the machine's LAN IP and otherwise never hydrates
  // (scroll + inputs work, React taps do not).
  allowedDevOrigins: localDevOrigins(),
  // Hide the floating Next.js Dev Tools badge (bottom-left). Errors still surface.
  devIndicators: false,
  experimental: {
    // Match MAX_ATTACHMENT_BYTES (5 MiB) — default 1 MiB rejects uploads before the action runs.
    serverActions: { bodySizeLimit: '5mb' },
    proxyClientMaxBodySize: '5mb',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
