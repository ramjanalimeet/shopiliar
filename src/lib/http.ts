import { getEnv } from "./cf";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

// Response.redirect() has read-only headers, so build it by hand to add cookies
export const redirect = (url: URL, to: string) =>
  new Response(null, { status: 302, headers: { Location: new URL(to, url).href, "Cache-Control": "no-store" } });

export const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try { return ((await request.json()) as Record<string, unknown>) || {}; } catch { return {}; }
};
export const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
export const str = (v: unknown) => (typeof v === "string" ? v : "");

export function getCookie(request: Request, name: string) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/** Where this request came from, as the visitor's browser sees it (host + protocol). */
export const publicUrl = (request: Request) => {
  const url = new URL(request.url);
  const host = request.headers.get("X-Forwarded-Host") || request.headers.get("Host");
  if (host) url.host = host;
  const proto = request.headers.get("X-Forwarded-Proto");
  if (proto === "http" || proto === "https") url.protocol = proto + ":";
  return url;
};

type Handler = (request: Request, env: CloudflareEnv, url: URL) => Promise<Response>;
type Options = {
  /** The body is JSON (the default); image uploads send the image itself */
  json?: boolean;
  /** Count the request against the per-IP limit (sign-in, sign-up, passwords, AI and messages) */
  limit?: boolean;
};

/**
 * Wraps an API route handler: checks the request came from this site (writes only), that the body is JSON,
 * applies the per-IP rate limit when asked, and turns any thrown error into a friendly 500.
 */
export const api = (fn: Handler, options: Options = {}) => async (request: Request): Promise<Response> => {
  const url = publicUrl(request);
  try {
    const env = await getEnv();
    if (request.method !== "GET") {
      // Cookies are SameSite=Lax; also refuse cross-site writes outright
      if (!sameOrigin(request.headers.get("Origin"), url)) return json({ error: "Bad origin." }, 403);
      if (options.json !== false && !(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "Expected JSON." }, 415);
    }
    if (options.limit && env.AUTH_LIMITER) {
      const { success } = await env.AUTH_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
      if (!success) return json({ error: "Too many attempts. Please wait a minute and try again." }, 429);
    }
    return await fn(request, env, url);
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

const sameOrigin = (origin: string | null, url: URL) => {
  if (!origin) return false;
  try { return new URL(origin).host === url.host; } catch { return false; }
};
