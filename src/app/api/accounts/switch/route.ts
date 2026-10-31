import { currentUser, otherTokens, SESSION_COOKIE, setOtherTokens, setSessionCookie, userForToken } from "@/lib/auth";
import { api, getCookie, json, readJson } from "@/lib/http";

// Switch to another store signed in on this device: its session becomes the current one, and this one joins the others
export const POST = api(async (request, env) => {
  const me = await currentUser(request, env);
  if (!me) return json({ error: "Not signed in." }, 401);
  const want = String((await readJson(request)).id || "");
  const tokens = otherTokens(request);
  for (const t of tokens) {
    const u = await userForToken(t, env);
    if (u && u.id === want) {
      const res = json({ ok: true, business: u.business });
      setSessionCookie(res, t);
      return setOtherTokens(res, [getCookie(request, SESSION_COOKIE) || "", ...tokens.filter((x) => x !== t)]);
    }
  }
  return json({ error: "That store isn't signed in on this device any more. Please sign in to it again." }, 404);
});
