import { clearSessionCookie, otherTokens, SESSION_COOKIE, setOtherTokens, setSessionCookie, userForToken } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { api, getCookie, json } from "@/lib/http";

// Sign out of this store. Another store still signed in on this device becomes the current one.
export const POST = api(async (request, env) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const others = otherTokens(request);
  for (const t of others) {
    const u = await userForToken(t, env);
    if (!u) continue;
    const res = json({ ok: true, switchedTo: u.business });
    setSessionCookie(res, t);
    return setOtherTokens(res, others.filter((x) => x !== t));
  }
  return setOtherTokens(clearSessionCookie(json({ ok: true })), []);
});
