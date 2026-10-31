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
  // Each store's logo (from its website settings), in one query
  const ids = [me.id, ...others.map((o) => o.id)];
  const { results } = await env.DB.prepare(`SELECT user_id, json_extract(data, '$.site.header.logo') AS logo FROM stores WHERE user_id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<{ user_id: string; logo: string | null }>();
  const logo = (id: string) => { const l = results.find((r) => r.user_id === id)?.logo || ""; return /^(\/media\/[\w-]+|https:\/\/[^\s"'<>]+)$/.test(l) ? l : ""; };
  const res = json({ accounts: [{ id: me.id, ...publicAccount(me), logo: logo(me.id), current: true }, ...others.map((o) => ({ ...o, logo: logo(o.id) }))] });
  return setOtherTokens(res, keep);
});
