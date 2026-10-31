import { api, json } from "@/lib/http";
import { getSettings, publicSettings } from "@/lib/platform";

// Shopilier's public details (contact, social links, sign-up and maintenance switches) for the website and dashboards
export const GET = api(async (_request, env) => {
  const res = json(publicSettings(await getSettings(env)));
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
});
