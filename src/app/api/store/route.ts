import { currentUser, publicAccount } from "@/lib/auth";
import { api, clean, json } from "@/lib/http";
import { CATEGORY, EMAIL, isPlan, templateOf } from "@/lib/plans";

const MAX_STORE_BYTES = 1_000_000;

// Saves the whole store dashboard (site, products, orders, pages, settings) and the account details
export const PUT = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const text = await request.text();
  if (text.length > MAX_STORE_BYTES) return json({ error: "Your store data is too large to save." }, 413);
  let body: { store?: unknown; account?: Record<string, unknown> };
  try { body = JSON.parse(text); } catch { return json({ error: "Expected JSON." }, 400); }
  if (!body || typeof body.store !== "object" || body.store === null || Array.isArray(body.store)) return json({ error: "Missing store." }, 400);

  const a = body.account || {};
  const next = {
    name: clean(a.name, 80) || user.name,
    business: clean(a.business, 80) || user.business,
    email: clean(a.email, 254).toLowerCase() || user.email,
    category: CATEGORY,
    plan: isPlan(a.plan) ? a.plan : user.plan,
    billing: a.billing === "yearly" || a.billing === "monthly" ? a.billing : user.billing,
    template: templateOf(a.template, user.template),
  };
  if (!EMAIL.test(next.email)) return json({ error: "Please enter a valid email." }, 400);
  if (next.email !== user.email) {
    const taken = await env.DB.prepare("SELECT 1 FROM users WHERE email = ? AND id != ?").bind(next.email, user.id).first();
    if (taken) return json({ error: "That email is already used by another account." }, 409);
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET name = ?, business = ?, email = ?, category = ?, plan = ?, billing = ?, template = ? WHERE id = ?")
      .bind(next.name, next.business, next.email, next.category, next.plan, next.billing, next.template, user.id),
    env.DB.prepare("INSERT INTO stores (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
      .bind(user.id, JSON.stringify(body.store), now),
  ]);
  return json({ account: publicAccount({ ...user, ...next }), savedAt: now });
});
