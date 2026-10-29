// Cloudflare Workers Builds deploys this project with `npx wrangler deploy`, and with no "Build command" set
// in the dashboard nothing would build the Next.js app first (the deploy then stops with "Open Next build not
// found"). Workers Builds sets WORKERS_CI=1, so on that runner the Worker is built here, right after install.
// Setting the dashboard's Build command to `npx opennextjs-cloudflare build` does the same thing in the build
// step instead; this script is harmless then (the deploy uses the fresh output either way).
import { execSync } from "node:child_process";

if (process.env.WORKERS_CI) {
  console.log("Workers Builds detected: building the Worker with OpenNext before the deploy step.");
  execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
}
