import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// `next dev` gets the same bindings as production (D1, the rate limiter, Workers AI) through wrangler.
// Workers AI only runs on Cloudflare: set NEXT_DEV_REMOTE_BINDINGS=1 (after `wrangler login`) to use the real
// service while developing; otherwise "Create with AI" falls back to its simple rules locally.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev({ remoteBindings: process.env.NEXT_DEV_REMOTE_BINDINGS === "1" ? undefined : false });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  // The old static site answered /pricing.html and friends; send those addresses to the clean URLs for good.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/:page(templates|pricing|demo|signin|signup|resources|contact|privacy).html", destination: "/:page", permanent: true },
      { source: "/admin/index.html", destination: "/admin", permanent: true },
      { source: "/demo/app.html", destination: "/demo/app", permanent: true },
      { source: "/master-admin/index.html", destination: "/master-admin", permanent: true },
    ];
  },
};

export default nextConfig;
