import { currentUser, otherTokens, publicAccount, setOtherTokens, userForToken } from "@/lib/auth";
import { api, json } from "@/lib/http";

// The stores signed in on this device: the current one first, then the others for the store switcher.
// Each store is its own account with its own plan. Tokens that stopped working are dropped from the device.
export const GET = api(async (request, env) => {
  const me = await currentUser(request, env);
  if (!me) return json({ error: "Not signed in." }, 401);
  const seen = new Set([me.id]), keep: string[] = [], others = [];
  for (const t of otherTokens(request)) {
    const u = await userForToken(t, env);
    if (!u || seen.has(u.id)) continue;
    seen.add(u.id); keep.push(t);
    others.push({ id: u.id, ...publicAccount(u), current: false });
  }
  const res = json({ accounts: [{ id: me.id, ...publicAccount(me), current: true }, ...others] });
  return setOtherTokens(res, keep);
});
