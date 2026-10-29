import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are rendered on demand or prerendered at build time; no incremental cache is needed.
export default defineCloudflareConfig({});
