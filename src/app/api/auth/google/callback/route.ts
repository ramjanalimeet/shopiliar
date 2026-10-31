import { UserRow, withSession } from "@/lib/auth";
import { decodeText, unb64 } from "@/lib/crypto";
import { GOOGLE_STATE_COOKIE, googleRedirectUri, nextPath } from "@/lib/google";
import { api, clean, getCookie, redirect } from "@/lib/http";
import { billingOf, CATEGORY, DEFAULT_PLAN, isPlan, templateOf } from "@/lib/plans";
import { getSettings } from "@/lib/platform";

type Pick = { state: string; next?: string; plan?: string; billing?: string; template?: string };

export const GET = api(async (request, env, url) => {
  const fail = (code: string) => {
    const res = redirect(url, "/signin?error=" + code);
    res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return res;
  };
  let pick: Pick | null = null;
  try { pick = JSON.parse(decodeText(unb64(getCookie(request, GOOGLE_STATE_COOKIE) || ""))); } catch { /* missing or bad cookie */ }
  const code = url.searchParams.get("code");
  if (!pick || !code || url.searchParams.get("state") !== pick.state) return fail("google");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID || "", client_secret: env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: googleRedirectUri(url), grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) { console.error("Google token exchange failed", tokenRes.status, await tokenRes.text()); return fail("google"); }
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  // The ID token came straight from Google over TLS, so its claims can be read without checking the signature
  let claims: { iss?: string; aud?: string; exp?: number; email?: string; email_verified?: boolean; name?: string };
  try { claims = JSON.parse(decodeText(unb64((id_token || "").split(".")[1]))); } catch { return fail("google"); }
  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issuerOk || claims.aud !== env.GOOGLE_CLIENT_ID || (claims.exp || 0) * 1000 < Date.now()) return fail("google");
  if (!claims.email || claims.email_verified !== true) return fail("google_email");

  const email = String(claims.email).toLowerCase();
  let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user) {
    // New accounts wait while sign-ups are paused (Settings in the master dashboard); existing ones still sign in
    if (!(await getSettings(env)).signups) return fail("signups_off");
    const name = clean(claims.name, 80) || email.split("@")[0];
    const fresh = {
      id: crypto.randomUUID(), email, name, business: name + "'s Store",
      category: CATEGORY,
      plan: isPlan(pick.plan) ? pick.plan : DEFAULT_PLAN,
      billing: billingOf(pick.billing),
      template: templateOf(pick.template),
      created_at: new Date().toISOString(),
    };
    // No password: this account signs in with Google (an empty hash never matches)
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, business, password_hash, password_salt, category, plan, billing, template, created_at) VALUES (?, ?, ?, ?, '', '', ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING"
    ).bind(fresh.id, fresh.email, fresh.name, fresh.business, fresh.category, fresh.plan, fresh.billing, fresh.template, fresh.created_at).run();
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
    if (!user) return fail("google");
  }

  const res = redirect(url, nextPath(pick.next));
  res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return withSession(env, user.id, true, res, request);
});
