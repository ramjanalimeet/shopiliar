import { api, redirect } from "@/lib/http";
import { b64, encodeText, randomBytes } from "@/lib/crypto";
import { GOOGLE_STATE_COOKIE, googleRedirectUri, nextPath } from "@/lib/google";

// "Continue with Google": sends the visitor to Google (OAuth 2.0 / OpenID Connect).
// Needs the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets, and
// <site>/api/auth/google/callback listed as a redirect URI in Google Cloud.
export const GET = api(async (_request, env, url) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return redirect(url, "/signin?error=google_off");
  const state = b64(randomBytes(24));
  // Remember what was picked on the Templates / Pricing pages for a new account
  const pick = {
    state,
    next: nextPath(url.searchParams.get("next")),
    plan: url.searchParams.get("plan"),
    billing: url.searchParams.get("billing"),
    template: url.searchParams.get("template"),
  };
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(url),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  const res = redirect(url, auth.href);
  res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=${b64(encodeText(JSON.stringify(pick)))}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return res;
});
