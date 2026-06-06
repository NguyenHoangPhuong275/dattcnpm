import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Security Headers
   * Applied to all routes. These are baseline protections for any web application.
   *
   * Note on CSP:
   * - A strict CSP is ideal but can break things like Leaflet, map tile providers,
   *   and future AI/LLM integrations.
   * - We start with a reasonably safe default and will tighten it in later weeks.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)", // Allow geolocation only for our own origin
          },
          // Basic CSP - will be hardened later when we know all external resources
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline/eval needed for Next.js dev + some libs
              "style-src 'self' 'unsafe-inline'",               // Tailwind and Leaflet need this
              "img-src 'self' data: https:",                     // Allow external map tiles (OSM, etc.)
              "font-src 'self' data:",
              "connect-src 'self' https:",                       // Allow API calls to external services
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
