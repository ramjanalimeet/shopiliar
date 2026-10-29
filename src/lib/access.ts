import { decodeText, encodeText, unb64 } from "./crypto";

// Verifies the Cf-Access-Jwt-Assertion token Cloudflare Access adds to requests it let through,
// so the master admin API can never be reached without your Access login.
let accessKeys: { at: number; keys: Array<{ kid: string; kty: string; n: string; e: string }> } | null = null;

export async function accessEmail(request: Request, env: CloudflareEnv) {
  if (env.ACCESS_DEV_BYPASS === "1") return "dev@localhost"; // local development only; never set in production
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const [h, p, sig] = token.split(".");
    const header = JSON.parse(decodeText(unb64(h)));
    const claims = JSON.parse(decodeText(unb64(p)));
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(env.ACCESS_AUD) || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}` || claims.exp * 1000 < Date.now()) return null;
    if (!accessKeys || Date.now() - accessKeys.at > 36e5 || !accessKeys.keys.some((k) => k.kid === header.kid)) {
      const res = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      accessKeys = { at: Date.now(), keys: ((await res.json()) as { keys?: typeof accessKeys extends null ? never : NonNullable<typeof accessKeys>["keys"] }).keys || [] };
    }
    const jwk = accessKeys.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256" }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64(sig) as BufferSource, encodeText(h + "." + p));
    return ok ? (claims.email as string) || "admin" : null;
  } catch (err) {
    console.error("Access token check failed", err);
    return null;
  }
}
