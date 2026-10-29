import { accessEmail } from "./access";
import { getEnv } from "./cf";
import { json, publicUrl } from "./http";

type Handler = (request: Request, env: CloudflareEnv, url: URL) => Promise<Response>;

// Master admin API (/master-admin/api/*): Cloudflare Access guards /master-admin, and the signed Access token
// is checked here too, so these routes can never be reached without your Access login.
export const adminApi = (fn: Handler) => async (request: Request): Promise<Response> => {
  const url = publicUrl(request);
  try {
    const env = await getEnv();
    const admin = await accessEmail(request, env);
    if (!admin) return json({ error: "Not allowed." }, 403);
    if (request.method !== "GET") {
      const origin = request.headers.get("Origin");
      let ok = false;
      try { ok = !!origin && new URL(origin).host === url.host; } catch { ok = false; }
      if (!ok) return json({ error: "Bad origin." }, 403);
      if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "Expected JSON." }, 415);
    }
    return await fn(request, env, url);
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};
