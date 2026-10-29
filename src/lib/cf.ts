import { getCloudflareContext } from "@opennextjs/cloudflare";

// Secrets and optional variables that aren't in wrangler.jsonc (set with `wrangler secret put`, or in .dev.vars locally)
declare global {
  interface CloudflareEnv {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    ACCESS_DEV_BYPASS?: string;
  }
}

/** The Worker's bindings (D1, Workers AI, the rate limiter, variables and secrets). */
export const getEnv = async (): Promise<CloudflareEnv> => (await getCloudflareContext({ async: true })).env;
